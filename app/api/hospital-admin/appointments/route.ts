import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || (user.role !== 'hospital_admin' && user.role !== 'doctor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  let hospital_id: number | undefined;

  if (user.role === 'hospital_admin') {
    const hospital = db
      .prepare('SELECT id FROM hospitals WHERE admin_user_id = ?')
      .get(user.id) as { id: number } | undefined;
    if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    hospital_id = hospital.id;
  } else {
    const doctor = db
      .prepare('SELECT hospital_id FROM doctors WHERE user_id = ?')
      .get(user.id) as { hospital_id: number } | undefined;
    if (!doctor) return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
    hospital_id = doctor.hospital_id;
  }

  const appointments = db
    .prepare(
      `SELECT a.*, p.full_name AS patient_name, p.phone AS patient_phone
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.assigned_hospital_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(hospital_id);

  return NextResponse.json({ appointments });
}
