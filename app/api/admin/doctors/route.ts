import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';
import { sendWelcomeStaffMember } from '@/lib/email';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const doctors = db.prepare(`
    SELECT d.id, d.full_name, d.specialization, d.state, d.phone,
           u.email, h.name AS hospital_name
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN hospitals h ON d.hospital_id = h.id
    ORDER BY d.full_name
  `).all();

  return NextResponse.json(doctors);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    full_name: string;
    email: string;
    password: string;
    hospital_id?: number | null;
    specialization?: string;
  };

  const { full_name, email, password, hospital_id, specialization } = body;

  if (!full_name || !email || !password) {
    return NextResponse.json({ error: 'Full name, email and password are required' }, { status: 400 });
  }
  if (!isPasswordValid(password)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENT_MESSAGE }, { status: 400 });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
  }

  let hospitalName: string | null = null;
  if (hospital_id) {
    const hosp = db.prepare('SELECT name FROM hospitals WHERE id = ?').get(hospital_id) as { name: string } | undefined;
    if (!hosp) return NextResponse.json({ error: 'Hospital not found' }, { status: 400 });
    hospitalName = hosp.name;
  }

  const hash = await bcrypt.hash(password, 12);

  const result = db.transaction(() => {
    const userResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES (?, ?, 'doctor', 1)`
    ).run(email, hash);

    const userId = userResult.lastInsertRowid;

    const docResult = db.prepare(
      `INSERT INTO doctors (user_id, hospital_id, full_name, specialization) VALUES (?, ?, ?, ?)`
    ).run(userId, hospital_id || null, full_name, specialization || null);

    return { doctorId: docResult.lastInsertRowid };
  })();

  try {
    await sendWelcomeStaffMember({
      to: email,
      role: 'doctor',
      hospitalName,
      tempPassword: password,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dbpando.com'}/login`,
    });
  } catch (e) {
    console.error('[doctors POST] Email send failed:', e);
  }

  return NextResponse.json({ id: result.doctorId }, { status: 201 });
}
