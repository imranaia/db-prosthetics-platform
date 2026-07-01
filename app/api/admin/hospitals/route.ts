import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const hospitals = db.prepare(`
    SELECT h.id, h.name, h.state, h.address, h.created_at, u.email AS admin_email
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
    address: string;
    admin_email: string;
    admin_password: string;
  };

  const { name, state, address, admin_email, admin_password } = body;

  if (!name || !state || !address || !admin_email || !admin_password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(admin_email);
  if (existing) {
    return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
  }

  const hash = await bcrypt.hash(admin_password, 12);

  const insertUser = db.prepare(
    `INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'hospital_admin')`
  );
  const insertHospital = db.prepare(
    `INSERT INTO hospitals (name, state, address, admin_user_id) VALUES (?, ?, ?, ?)`
  );

  const result = db.transaction(() => {
    const userResult = insertUser.run(admin_email, hash);
    const hospResult = insertHospital.run(name, state, address, userResult.lastInsertRowid);
    return hospResult;
  })();

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
