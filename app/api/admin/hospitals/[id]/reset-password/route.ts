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
  const hospital = db.prepare('SELECT admin_user_id, name FROM hospitals WHERE id = ?').get(id) as { admin_user_id: number | null; name: string } | undefined;
  if (!hospital || !hospital.admin_user_id) {
    return NextResponse.json({ error: 'Hospital admin account not found' }, { status: 404 });
  }

  const result = await resetUserPassword(hospital.admin_user_id, hospital.name);
  if ('error' in result) return NextResponse.json(result, { status: 404 });

  return NextResponse.json({ success: true });
}
