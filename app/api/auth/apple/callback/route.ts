import { NextRequest, NextResponse } from 'next/server';
import { signToken, cookieOptions } from '@/lib/jwt';
import getDb from '@/lib/db';
import { importPKCS8, SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';

// Apple sends callback as a POST with form data (response_mode: form_post)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const code    = formData.get('code') as string;
    const idToken = formData.get('id_token') as string;
    // Apple sends user JSON only on first sign-in
    const userStr = formData.get('user') as string | null;

    if (!code && !idToken) {
      return NextResponse.redirect(new URL('/login?error=apple_cancelled', req.url));
    }

    let email: string | undefined;
    let fullName: string | undefined;

    // Verify id_token with Apple's public keys
    if (idToken) {
      const JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_CLIENT_ID!,
      });
      email = payload.email as string | undefined;
    }

    // First sign-in: Apple provides name in the user field
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        fullName = [u.name?.firstName, u.name?.lastName].filter(Boolean).join(' ') || undefined;
        if (!email) email = u.email;
      } catch {}
    }

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=apple_no_email', req.url));
    }

    const db = getDb();
    let row = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(email) as
      { id: number; email: string; role: string } | undefined;

    if (!row) {
      const result = db.prepare(
        `INSERT INTO users (email, password_hash, role) VALUES (?, '', 'patient')`
      ).run(email);
      const userId = result.lastInsertRowid as number;
      db.prepare(`INSERT INTO patients (user_id, full_name) VALUES (?, ?)`).run(userId, fullName || email.split('@')[0]);
      row = { id: userId, email, role: 'patient' };
    }

    const token = await signToken({ id: row.id, email: row.email, role: row.role });
    const opts  = cookieOptions(token);
    const res   = NextResponse.redirect(new URL('/dashboard/patient', req.url));
    res.cookies.set(opts);
    return res;

  } catch (err) {
    console.error('[apple-oauth]', err);
    return NextResponse.redirect(new URL('/login?error=apple_failed', req.url));
  }
}
