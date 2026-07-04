import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

async function getHospital(userId: number) {
  const db = getDb();
  return db
    .prepare('SELECT id, name FROM hospitals WHERE admin_user_id = ?')
    .get(userId) as { id: number; name: string } | undefined;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
  }

  const db = getDb();

  const doctors = db
    .prepare(
      `SELECT 'doctor' as role, u.id as user_id, u.email, d.id as staff_id,
              d.full_name, d.phone, d.specialization, d.state, d.lga, d.address,
              d.years_experience, d.qualifications
       FROM doctors d JOIN users u ON d.user_id = u.id
       WHERE d.hospital_id = ?`
    )
    .all(hospital.id);

  const poSpecialists = db
    .prepare(
      `SELECT 'po_specialist' as role, u.id as user_id, u.email, p.id as staff_id
       FROM po_specialists p JOIN users u ON p.user_id = u.id
       WHERE p.hospital_id = ?`
    )
    .all(hospital.id);

  return NextResponse.json({ staff: [...doctors, ...poSpecialists] });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
  }

  const {
    role, email, password,
    full_name, phone, specialization, state, lga, address, years_experience, qualifications,
  } = await req.json();

  if (!role || !email || !password) {
    return NextResponse.json({ error: 'role, email, and password are required.' }, { status: 400 });
  }
  if (!isPasswordValid(password)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENT_MESSAGE }, { status: 400 });
  }
  if (role !== 'doctor' && role !== 'po_specialist') {
    return NextResponse.json({ error: 'Invalid role. Must be doctor or po_specialist.' }, { status: 400 });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const addStaff = db.transaction(() => {
    const userResult = db
      .prepare(
        `INSERT INTO users (email, password_hash, role, must_change_password)
         VALUES (?, ?, ?, 1)`
      )
      .run(email, password_hash, role);

    const newUserId = userResult.lastInsertRowid;

    if (role === 'doctor') {
      const doctorResult = db.prepare('INSERT INTO doctors (user_id, hospital_id) VALUES (?, ?)').run(newUserId, hospital.id);
      db.prepare(
        'UPDATE doctors SET full_name=?, phone=?, specialization=?, state=?, lga=?, address=?, years_experience=?, qualifications=? WHERE id=?'
      ).run(
        full_name || null,
        phone || null,
        specialization || null,
        state || null,
        lga || null,
        address || null,
        years_experience ? Number(years_experience) : null,
        qualifications || null,
        doctorResult.lastInsertRowid,
      );
    } else {
      db.prepare('INSERT INTO po_specialists (user_id, hospital_id) VALUES (?, ?)').run(newUserId, hospital.id);
    }

    return newUserId;
  });

  addStaff();

  try {
    const { sendWelcomeStaffMember } = await import('@/lib/email');
    await sendWelcomeStaffMember({
      to: email,
      role: role as 'doctor' | 'po_specialist',
      hospitalName: hospital.name,
      tempPassword: password,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login`,
    });
  } catch (e) {
    console.error('[staff] email failed', e);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
  }

  const {
    staff_id, role, email,
    full_name, phone, specialization, state, lga, address, years_experience, qualifications,
  } = await req.json();

  if (!staff_id || !role) {
    return NextResponse.json({ error: 'staff_id and role are required.' }, { status: 400 });
  }
  if (role !== 'doctor' && role !== 'po_specialist') {
    return NextResponse.json({ error: 'Invalid role. Must be doctor or po_specialist.' }, { status: 400 });
  }

  const db = getDb();
  const table = role === 'doctor' ? 'doctors' : 'po_specialists';
  const staffRow = db.prepare(`SELECT user_id FROM ${table} WHERE id = ? AND hospital_id = ?`).get(staff_id, hospital.id) as { user_id: number } | undefined;
  if (!staffRow) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

  if (email !== undefined) {
    const newEmail = String(email).trim().toLowerCase();
    if (!newEmail) return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 });
    const clash = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, staffRow.user_id);
    if (clash) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, staffRow.user_id);
  }

  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  if (full_name !== undefined)       { setClauses.push('full_name = ?');       values.push(full_name || null); }
  if (phone !== undefined)           { setClauses.push('phone = ?');           values.push(phone || null); }
  if (state !== undefined)           { setClauses.push('state = ?');           values.push(state || null); }
  if (lga !== undefined)             { setClauses.push('lga = ?');             values.push(lga || null); }
  if (address !== undefined)         { setClauses.push('address = ?');         values.push(address || null); }
  if (role === 'doctor' && specialization !== undefined)   { setClauses.push('specialization = ?');   values.push(specialization || null); }
  if (role === 'doctor' && years_experience !== undefined) { setClauses.push('years_experience = ?'); values.push(years_experience ? Number(years_experience) : null); }
  if (role === 'doctor' && qualifications !== undefined)   { setClauses.push('qualifications = ?');   values.push(qualifications || null); }

  if (setClauses.length > 0) {
    values.push(staff_id);
    db.prepare(`UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
  }

  const { staff_id, role } = await req.json();

  if (!staff_id || !role) {
    return NextResponse.json({ error: 'staff_id and role are required.' }, { status: 400 });
  }

  const db = getDb();

  if (role === 'doctor') {
    db.prepare('DELETE FROM doctors WHERE id = ? AND hospital_id = ?').run(staff_id, hospital.id);
  } else if (role === 'po_specialist') {
    db.prepare('DELETE FROM po_specialists WHERE id = ? AND hospital_id = ?').run(staff_id, hospital.id);
  } else {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
