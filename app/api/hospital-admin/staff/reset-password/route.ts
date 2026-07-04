import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import { resetUserPassword } from '@/lib/reset-password';

async function getHospital(userId: number) {
  const db = getDb();
  return db.prepare('SELECT id FROM hospitals WHERE admin_user_id = ?').get(userId) as { id: number } | undefined;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

  const { staff_id, role } = await req.json();
  if (!staff_id || !role) return NextResponse.json({ error: 'staff_id and role are required.' }, { status: 400 });
  if (role !== 'doctor' && role !== 'po_specialist') {
    return NextResponse.json({ error: 'Invalid role. Must be doctor or po_specialist.' }, { status: 400 });
  }

  const db = getDb();
  const table = role === 'doctor' ? 'doctors' : 'po_specialists';
  const staffRow = db.prepare(`SELECT user_id, full_name FROM ${table} WHERE id = ? AND hospital_id = ?`).get(staff_id, hospital.id) as { user_id: number; full_name: string | null } | undefined;
  if (!staffRow) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

  const result = await resetUserPassword(staffRow.user_id, staffRow.full_name);
  if ('error' in result) return NextResponse.json(result, { status: 404 });

  return NextResponse.json({ success: true });
}
