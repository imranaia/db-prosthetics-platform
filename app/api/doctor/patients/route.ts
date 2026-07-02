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

  const patients = db
    .prepare(
      `SELECT DISTINCT p.id, p.full_name, p.phone, p.state, p.lga, p.dob, p.address,
              MAX(c.created_at) AS last_consultation
       FROM patients p
       JOIN consultations c ON p.id = c.patient_id
       WHERE c.doctor_id = ?
       GROUP BY p.id
       ORDER BY last_consultation DESC`
    )
    .all(doctor.id);

  return NextResponse.json({ patients });
}
