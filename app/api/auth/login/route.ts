import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import getDb from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/jwt';
import { sendLockoutConfirmation } from '@/lib/email';

const MAX_FAILED_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = getDb();
    const user = db
      .prepare('SELECT id, email, password_hash, role, must_change_password, failed_login_attempts, locked_at FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as any;

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.locked_at) {
      return NextResponse.json(
        { error: 'This account is locked after too many failed sign-in attempts. Check your email for a link to confirm and reset your password.' },
        { status: 423 }
      );
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const attempts = (user.failed_login_attempts || 0) + 1;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        db.prepare(`UPDATE users SET failed_login_attempts = ?, locked_at = datetime('now') WHERE id = ?`).run(attempts, user.id);

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
        db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

        const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/reset-confirm?token=${token}`;
        try {
          await sendLockoutConfirmation({ to: user.email, confirmUrl });
        } catch (e) {
          console.error('[login] lockout email failed:', e);
        }

        return NextResponse.json(
          { error: 'Too many failed attempts. Your account has been locked — check your email to confirm and reset your password.' },
          { status: 423 }
        );
      }

      db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(attempts, user.id);
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.failed_login_attempts > 0) {
      db.prepare('UPDATE users SET failed_login_attempts = 0 WHERE id = ?').run(user.id);
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role });

    const res = NextResponse.json({ success: true, role: user.role, must_change_password: user.must_change_password === 1 });
    res.cookies.set(cookieOptions(token));

    return res;
  } catch (err) {
    console.error('[login] error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
