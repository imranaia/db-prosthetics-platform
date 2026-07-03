import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const hospital = db
    .prepare('SELECT id FROM hospitals WHERE admin_user_id = ?')
    .get(user.id) as { id: number } | undefined;

  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
  }

  const consultations = db
    .prepare(
      `SELECT c.id, c.assessor_name, c.chief_complaint, c.recommended_device, c.created_at, c.consent_given,
              c.assessor_signature, c.patient_signature,
              p.full_name AS patient_name, p.phone AS patient_phone
       FROM consultations c
       LEFT JOIN patients p ON c.patient_id = p.id
       WHERE c.hospital_id = ?
       ORDER BY c.created_at DESC
       LIMIT 50`
    )
    .all(hospital.id);

  return NextResponse.json({ consultations });
}
