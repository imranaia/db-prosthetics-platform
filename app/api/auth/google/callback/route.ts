import { NextRequest, NextResponse } from 'next/server';
import { signToken, cookieOptions } from '@/lib/jwt';
import getDb from '@/lib/db';
import { formatPatientId } from '@/lib/patient-id';

const ROLE_PATHS: Record<string, string> = {
  super_admin:    '/dashboard/super-admin',
  hospital_admin: '/dashboard/hospital-admin',
  doctor:         '/dashboard/doctor',
  po_specialist:  '/dashboard/po-specialist',
  patient:        '/dashboard/patient',
  receptionist:   '/dashboard/receptionist',
};

export async function GET(req: NextRequest) {
  const code    = req.nextUrl.searchParams.get('code');
  const error   = req.nextUrl.searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_cancelled`);
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  `${baseUrl}/api/auth/google/callback`,
        grant_type:    'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token from Google');

    // 2. Get user info
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const gUser = await infoRes.json();
    if (!gUser.email) throw new Error('No email from Google');

    // 3. Find or create user
    const db = getDb();
    let row = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(gUser.email) as
      { id: number; email: string; role: string } | undefined;

    if (!row) {
      // New patient — register them
      const result = db.prepare(
        `INSERT INTO users (email, password_hash, role) VALUES (?, '', 'patient')`
      ).run(gUser.email);

      const userId = result.lastInsertRowid as number;
      const patientResult = db.prepare(
        `INSERT INTO patients (user_id, full_name) VALUES (?, ?)`
      ).run(userId, gUser.name || gUser.email.split('@')[0]);

      const patientId = patientResult.lastInsertRowid as number;
      db.prepare('UPDATE patients SET patient_unique_id = ? WHERE id = ?').run(formatPatientId(patientId), patientId);

      row = { id: userId, email: gUser.email, role: 'patient' };
    }

    // 4. Issue JWT
    const token = await signToken({ id: row.id, email: row.email, role: row.role });
    const opts  = cookieOptions(token);
    const dest  = ROLE_PATHS[row.role] || '/dashboard/patient';
    const res   = NextResponse.redirect(`${baseUrl}${dest}`);
    res.cookies.set(opts);
    return res;

  } catch (err) {
    console.error('[google-oauth]', err);
    return NextResponse.redirect(`${baseUrl}/login?error=google_failed`);
  }
}
