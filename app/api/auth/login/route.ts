import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = getDb();
    const user = db
      .prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as any;

    if (!user) {
      console.log(`[login] No user found: ${email}`);
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log(`[login] Wrong password for: ${email}`);
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role });

    const res = NextResponse.json({ success: true, role: user.role });
    res.cookies.set(cookieOptions(token));

    console.log(`[login] Success: ${user.email} (${user.role})`);
    return res;
  } catch (err) {
    console.error('[login] error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
