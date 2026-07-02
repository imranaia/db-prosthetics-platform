import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendWelcomeHospitalAdmin } from '@/lib/email';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const hospitals = db.prepare(`
    SELECT h.id, h.name, h.state, h.lga, h.landmark, h.address, h.created_at, u.email AS admin_email
    FROM hospitals h
    LEFT JOIN users u ON h.admin_user_id = u.id
    ORDER BY h.created_at DESC
  `).all();

  return NextResponse.json(hospitals);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    name: string;
    state: string;
    lga?: string;
    landmark?: string;
    address?: string;
    admin_email: string;
    admin_password: string;
  };

  const { name, state, lga, landmark, address, admin_email, admin_password } = body;

  if (!name || !state || !admin_email || !admin_password) {
    return NextResponse.json({ error: 'Name, state, admin email and password are required' }, { status: 400 });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(admin_email);
  if (existing) {
    return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
  }

  const hash = await bcrypt.hash(admin_password, 12);

  const result = db.transaction(() => {
    const userResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES (?, ?, 'hospital_admin', 1)`
    ).run(admin_email, hash);

    const userId = userResult.lastInsertRowid;

    const hospResult = db.prepare(
      `INSERT INTO hospitals (name, state, lga, landmark, address, admin_user_id) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(name, state, lga || null, landmark || null, address || null, userId);

    return { hospId: hospResult.lastInsertRowid };
  })();

  // Send welcome email — don't fail the request if email fails
  try {
    await sendWelcomeHospitalAdmin({
      to: admin_email,
      hospitalName: name,
      tempPassword: admin_password,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dbprosthetics.com'}/login`,
    });
  } catch (e) {
    console.error('[hospitals POST] Email send failed:', e);
  }

  return NextResponse.json({ id: result.hospId }, { status: 201 });
}
