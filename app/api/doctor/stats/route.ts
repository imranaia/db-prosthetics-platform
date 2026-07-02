import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || (user.role !== 'doctor' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const doctor = db
    .prepare('SELECT id, hospital_id FROM doctors WHERE user_id = ?')
    .get(user.id) as { id: number; hospital_id: number } | undefined;

  if (!doctor) {
    return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
  }

  const patients = (db
    .prepare('SELECT COUNT(DISTINCT patient_id) as count FROM consultations WHERE doctor_id = ?')
    .get(doctor.id) as { count: number }).count;

  const consultations = (db
    .prepare('SELECT COUNT(*) as count FROM consultations WHERE doctor_id = ?')
    .get(doctor.id) as { count: number }).count;

  const upcoming_appointments = (db
    .prepare(
      "SELECT COUNT(*) as count FROM appointments WHERE assigned_hospital_id = ? AND status NOT IN ('completed','cancelled')"
    )
    .get(doctor.hospital_id) as { count: number }).count;

  return NextResponse.json({
    stats: { patients, consultations, upcoming_appointments },
  });
}
