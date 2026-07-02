import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;

  if (!patient) {
    return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
  }

  const consultations = db
    .prepare(
      `SELECT c.*, h.name AS hospital_name, h.state AS hospital_state
       FROM consultations c
       LEFT JOIN hospitals h ON c.hospital_id = h.id
       WHERE c.patient_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(patient.id);

  return NextResponse.json({ consultations });
}
