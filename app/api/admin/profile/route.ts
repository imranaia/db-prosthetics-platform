import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { current_password, new_password } = await req.json();
  if (!current_password || !new_password) return NextResponse.json({ error: 'Both fields are required.' }, { status: 400 });
  if (new_password.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });

  const db = getDb();
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string } | undefined;
  if (!row) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const valid = await bcrypt.compare(current_password, row.password_hash);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

  const hash = await bcrypt.hash(new_password, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  return NextResponse.json({ success: true });
}
