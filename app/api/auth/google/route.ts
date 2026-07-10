import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { OAUTH_STATE_COOKIE } from '@/lib/oauth';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL;

  if (!clientId || !baseUrl) {
    return NextResponse.json({ error: 'Google OAuth not configured.' }, { status: 503 });
  }

  // Random state, echoed back by Google and checked in the callback, so an
  // attacker can't inject their own authorization code into a victim's
  // browser and get them silently logged into the attacker's account.
  const state = crypto.randomBytes(32).toString('hex');

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  `${baseUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
    state,
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
