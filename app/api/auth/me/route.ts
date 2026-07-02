import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ user: null });

  let hasDoctorProfile = false;
  if (user.role === 'super_admin') {
    const db = getDb();
    const row = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id);
    hasDoctorProfile = !!row;
  }

  return NextResponse.json({ user: { ...user, hasDoctorProfile } });
}
