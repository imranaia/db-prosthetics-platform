import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'doctor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const doctor = db
    .prepare('SELECT id, hospital_id FROM doctors WHERE user_id = ?')
    .get(user.id) as { id: number; hospital_id: number } | undefined;

  if (!doctor) {
    return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
  }

  const appointments = db
    .prepare(
      `SELECT a.*, p.full_name AS patient_name, p.phone AS patient_phone
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.assigned_hospital_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(doctor.hospital_id);

  return NextResponse.json({ appointments });
}
