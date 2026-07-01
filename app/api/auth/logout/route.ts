import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/jwt';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ name: SESSION_COOKIE, value: '', maxAge: 0, path: '/' });
  return res;
}
