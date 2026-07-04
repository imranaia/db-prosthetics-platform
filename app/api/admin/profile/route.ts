import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const row = db.prepare('SELECT id, email, full_name, phone, dob, gender, address, state, lga, marital_status, occupation, religion, next_of_kin_name, next_of_kin_relationship, next_of_kin_phone FROM users WHERE id = ?').get(user.id);
  return NextResponse.json({ profile: row });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    current_password?: string;
    new_password?: string;
    full_name?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    address?: string;
    state?: string;
    lga?: string;
    marital_status?: string;
    occupation?: string;
    religion?: string;
    next_of_kin_name?: string;
    next_of_kin_relationship?: string;
    next_of_kin_phone?: string;
  };

  const db = getDb();

  // Password change
  if (body.current_password && body.new_password) {
    if (!isPasswordValid(body.new_password)) return NextResponse.json({ error: PASSWORD_REQUIREMENT_MESSAGE }, { status: 400 });
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string } | undefined;
    if (!row) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const valid = await bcrypt.compare(body.current_password, row.password_hash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    const hash = await bcrypt.hash(body.new_password, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
    return NextResponse.json({ success: true });
  }

  // Profile update
  const setClauses: string[] = [];
  const values: (string | null)[] = [];
  const fields = ['full_name','phone','dob','gender','address','state','lga','marital_status','occupation','religion','next_of_kin_name','next_of_kin_relationship','next_of_kin_phone'] as const;
  for (const f of fields) {
    if (body[f] !== undefined) { setClauses.push(`${f} = ?`); values.push(body[f] ?? null); }
  }
  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(user.id as unknown as string);
  db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  return NextResponse.json({ success: true });
}
