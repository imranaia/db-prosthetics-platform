import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

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
      `SELECT 'doctor' as role, u.id as user_id, u.email, d.id as staff_id
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

  const { role, email, password, full_name } = await req.json();

  if (!role || !email || !password) {
    return NextResponse.json({ error: 'role, email, and password are required.' }, { status: 400 });
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
      db.prepare('INSERT INTO doctors (user_id, hospital_id) VALUES (?, ?)').run(newUserId, hospital.id);
    } else {
      db.prepare('INSERT INTO po_specialists (user_id, hospital_id) VALUES (?, ?)').run(newUserId, hospital.id);
    }

    return newUserId;
  });

  addStaff();

  try {
    const { sendWelcomeHospitalAdmin } = await import('@/lib/email');
    await sendWelcomeHospitalAdmin({
      to: email,
      hospitalName: hospital.name,
      tempPassword: password,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login`,
    });
  } catch (e) {
    console.error('[staff] email failed', e);
  }

  return NextResponse.json({ success: true }, { status: 201 });
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
