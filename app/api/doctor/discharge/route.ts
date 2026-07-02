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

  const doctor = db.prepare('SELECT id, hospital_id FROM doctors WHERE user_id = ?').get(user.id) as any;
  if (!doctor) return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });

  // Get discharge forms for patients this doctor has consulted
  const forms = db.prepare(`
    SELECT DISTINCT df.*, p.full_name AS patient_name, h.name AS hospital_name
    FROM discharge_forms df
    LEFT JOIN patients p ON df.patient_id = p.id
    LEFT JOIN hospitals h ON df.hospital_id = h.id
    WHERE df.patient_id IN (
      SELECT DISTINCT patient_id FROM consultations WHERE doctor_id = ?
    )
    ORDER BY df.created_at DESC
  `).all(doctor.id);

  return NextResponse.json({ forms });
}
