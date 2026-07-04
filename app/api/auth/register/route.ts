import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';
import { isPasswordValid, PASSWORD_REQUIREMENT_MESSAGE } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { full_name, email, password, phone, dob, state, lga, address } = await req.json();

    // Basic validation
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (!isPasswordValid(password)) {
      return NextResponse.json(
        { error: PASSWORD_REQUIREMENT_MESSAGE },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const db = getDb();

    // Check email not already in use
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Insert user and patient record in one transaction
    const insertBoth = db.transaction(() => {
      const userResult = db
        .prepare(
          `INSERT INTO users (email, password_hash, role)
           VALUES (?, ?, 'patient')`
        )
        .run(email, password_hash);

      const userId = userResult.lastInsertRowid;

      db.prepare(
        `INSERT INTO patients (user_id, full_name, phone, dob, state, lga, address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, full_name, phone || null, dob || null, state || null, lga || null, address || null);

      return userId;
    });

    insertBoth();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
