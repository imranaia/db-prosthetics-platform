import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';
import { sendLockoutResetComplete } from '@/lib/email';
import { generateTempPassword } from '@/lib/temp-password';

export async function POST(req: NextRequest) {
  const { token } = await req.json() as { token?: string };
  if (!token) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
  }

  const db = getDb();
  const row = db.prepare(`
    SELECT t.id AS token_id, t.expires_at, t.used_at, u.id AS user_id, u.email
    FROM password_reset_tokens t
    JOIN users u ON t.user_id = u.id
    WHERE t.token = ?
  `).get(token) as { token_id: number; expires_at: string; used_at: string | null; user_id: number; email: string } | undefined;

  if (!row) {
    return NextResponse.json({ error: 'This reset link is invalid.' }, { status: 400 });
  }
  if (row.used_at) {
    return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This reset link has expired. Try signing in again to request a new one.' }, { status: 400 });
  }

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  db.prepare(`UPDATE users SET password_hash = ?, must_change_password = 1, failed_login_attempts = 0, locked_at = NULL WHERE id = ?`)
    .run(hash, row.user_id);
  db.prepare(`UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?`).run(row.token_id);

  try {
    await sendLockoutResetComplete({
      to: row.email,
      tempPassword,
      loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/login`,
    });
  } catch (e) {
    console.error('[confirm-reset] email failed:', e);
  }

  return NextResponse.json({ success: true });
}

