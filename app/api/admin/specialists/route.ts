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
  const specialists = db.prepare(`
    SELECT p.id, u.id as user_id, u.email, p.hospital_id, h.name AS hospital_name
    FROM po_specialists p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN hospitals h ON p.hospital_id = h.id
    WHERE u.role = 'po_specialist'
    ORDER BY u.email
  `).all();

  return NextResponse.json({ specialists });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, password, hospital_id } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  if (!isPasswordValid(password)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENT_MESSAGE }, { status: 400 });
  }

  const db = getDb();
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  let hospitalName: string | null = null;
  if (hospital_id) {
    const hospital = db.prepare('SELECT name FROM hospitals WHERE id = ?').get(hospital_id) as { name: string } | undefined;
    if (!hospital) return NextResponse.json({ error: 'Hospital not found.' }, { status: 404 });
    hospitalName = hospital.name;
  }

  const password_hash = await bcrypt.hash(password, 12);

  db.transaction(() => {
    const userResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES (?, ?, 'po_specialist', 1)`
    ).run(normalizedEmail, password_hash);

    db.prepare('INSERT INTO po_specialists (user_id, hospital_id) VALUES (?, ?)').run(userResult.lastInsertRowid, hospital_id || null);
  })();

  try {
    await sendWelcomeStaffMember({
      to: normalizedEmail,
      role: 'po_specialist',
      hospitalName,
      tempPassword: password,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login`,
    });
  } catch (e) {
    console.error('[admin/specialists] email failed:', e);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { specialist_id } = await req.json();
  if (!specialist_id) return NextResponse.json({ error: 'specialist_id is required.' }, { status: 400 });

  const db = getDb();
  const row = db.prepare(
    `SELECT p.id FROM po_specialists p JOIN users u ON p.user_id = u.id WHERE p.id = ? AND u.role = 'po_specialist'`
  ).get(specialist_id);
  if (!row) return NextResponse.json({ error: 'P&O Specialist not found.' }, { status: 404 });

  db.prepare('DELETE FROM po_specialists WHERE id = ?').run(specialist_id);

  return NextResponse.json({ success: true });
}
