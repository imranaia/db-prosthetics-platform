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
  if (!patient) return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });

  const forms = db.prepare(`
    SELECT cf.*, h.name AS hospital_name
    FROM consent_forms cf
    LEFT JOIN hospitals h ON cf.hospital_id = h.id
    WHERE cf.patient_id = ?
    ORDER BY cf.created_at DESC
  `).all(patient.id);

  return NextResponse.json({ forms });
}
