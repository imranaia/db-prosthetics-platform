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
  const patients = db.prepare(`
    SELECT p.*, u.email AS portal_email,
      (SELECT MIN(a.scheduled_date) FROM appointments a
       WHERE a.patient_id = p.id AND a.scheduled_date >= datetime('now')
         AND a.status NOT IN ('cancelled', 'completed')) AS next_appointment_date
    FROM patients p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    full_name: string;
    email: string;
    phone?: string;
    dob?: string;
    state?: string;
    lga?: string;
    address?: string;
    send_email?: boolean;
  };

  const { full_name, email, phone, dob, state, lga, address, send_email } = body;

  if (!full_name?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });

  // Generate a random temporary password
  const tempPassword = Math.random().toString(36).slice(2, 10).toUpperCase() + Math.floor(Math.random() * 900 + 100);
  const hash = await bcrypt.hash(tempPassword, 12);

  const result = db.transaction(() => {
    const userResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES (?, ?, 'patient', 1)`
    ).run(email.trim().toLowerCase(), hash);

    const userId = userResult.lastInsertRowid;

    db.prepare(
      `INSERT INTO patients (user_id, full_name, phone, dob, state, lga, address) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, full_name.trim(), phone?.trim() || null, dob || null, state || null, lga || null, address?.trim() || null);

    return { tempPassword };
  })();

  // Send welcome email (don't fail the request if email fails)
  if (send_email !== false && email) {
    try {
      const { sendWelcomePatient } = await import('@/lib/email');
      await sendWelcomePatient({
        to: email,
        fullName: full_name.trim(),
        tempPassword: result.tempPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dbpando.com'}/login`,
      });
    } catch (e) {
      console.error('[patients POST] Email send failed:', e);
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
