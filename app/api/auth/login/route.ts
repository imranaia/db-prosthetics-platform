import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import getDb from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/jwt';
import { sendLockoutConfirmation } from '@/lib/email';

const MAX_FAILED_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

type LoginUser = {
  id: number;
  email: string | null;
  password_hash: string | null;
  pin_hash: string | null;
  role: string;
  must_change_password: number;
  failed_login_attempts: number;
  locked_at: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, patient_id } = await req.json();

    const db = getDb();
    let user: LoginUser | undefined;
    let secret: string | undefined;
    let secretHashColumn: 'password_hash' | 'pin_hash';

    if (patient_id && password) {
      // ID + password login — every patient now gets a real password
      // (including walk-ins with no email), same as the email path. A
      // patient created before this only has pin_hash set — fall back to
      // checking that instead, until their password is reset.
      user = db
        .prepare(
          `SELECT u.id, u.email, u.password_hash, u.pin_hash, u.role,
                  u.must_change_password, u.failed_login_attempts, u.locked_at
           FROM users u JOIN patients p ON p.user_id = u.id
           WHERE p.patient_unique_id = ? AND u.role = 'patient'`
        )
        .get(String(patient_id).trim().toUpperCase()) as LoginUser | undefined;
      secret = password;
      secretHashColumn = user?.password_hash ? 'password_hash' : 'pin_hash';
    } else if (email && password) {
      user = db
        .prepare(
          `SELECT id, email, password_hash, pin_hash, role, must_change_password, failed_login_attempts, locked_at
           FROM users WHERE email = ?`
        )
        .get(email.trim().toLowerCase()) as LoginUser | undefined;
      secret = password;
      secretHashColumn = 'password_hash';
    } else {
      return NextResponse.json({ error: 'Email and password, or Patient ID and password, are required.' }, { status: 400 });
    }

    if (!user || !user[secretHashColumn] || !secret) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.locked_at) {
      const message = user.email
        ? 'This account is locked after too many failed sign-in attempts. Check your email for a link to confirm and reset your password.'
        : 'This account is locked after too many failed sign-in attempts. Please visit your hospital to have your password reset.';
      return NextResponse.json({ error: message }, { status: 423 });
    }

    const match = await bcrypt.compare(secret, user[secretHashColumn] as string);
    if (!match) {
      const attempts = (user.failed_login_attempts || 0) + 1;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        db.prepare(`UPDATE users SET failed_login_attempts = ?, locked_at = datetime('now') WHERE id = ?`).run(attempts, user.id);

        if (user.email) {
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

        return NextResponse.json(
          { error: 'Too many failed attempts. Your account has been locked — please visit your hospital to have your password reset.' },
          { status: 423 }
        );
      }

      db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(attempts, user.id);
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.failed_login_attempts > 0) {
      db.prepare('UPDATE users SET failed_login_attempts = 0 WHERE id = ?').run(user.id);
    }

    const token = await signToken({ id: user.id, email: user.email || undefined, role: user.role });

    const res = NextResponse.json({ success: true, role: user.role, must_change_password: user.must_change_password === 1 });
    res.cookies.set(cookieOptions(token));

    return res;
  } catch (err) {
    console.error('[login] error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
