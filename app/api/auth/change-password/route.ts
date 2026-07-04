import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const currentUser = token ? await verifyToken(token) : null;
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { new_password } = await req.json() as { new_password: string };
  if (!new_password || !isPasswordValid(new_password)) {
    return NextResponse.json({ error: PASSWORD_REQUIREMENT_MESSAGE }, { status: 400 });
  }

  const hash = await bcrypt.hash(new_password, 12);
  const db = getDb();
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, currentUser.id);

  return NextResponse.json({ success: true });
}
