import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import { resetUserPassword } from '@/lib/reset-password';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const patient = db.prepare('SELECT user_id, full_name FROM patients WHERE id = ?').get(id) as { user_id: number; full_name: string } | undefined;
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  const result = await resetUserPassword(patient.user_id, patient.full_name);
  if ('error' in result) return NextResponse.json(result, { status: 404 });

  // Patients with no email can't be emailed the new password — hand it
  // back so the admin can give it to them directly.
  const hasEmail = db.prepare('SELECT email FROM users WHERE id = ?').get(patient.user_id) as { email: string | null } | undefined;
  return NextResponse.json({ success: true, password: hasEmail?.email ? undefined : result.tempPassword });
}
