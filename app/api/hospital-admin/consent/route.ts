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

  const hospital = db.prepare('SELECT id FROM hospitals WHERE admin_user_id = ?').get(user.id) as { id: number } | undefined;
  if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

  const forms = db.prepare(`
    SELECT cf.*, p.full_name AS patient_name, p.phone AS patient_phone
    FROM consent_forms cf
    LEFT JOIN patients p ON cf.patient_id = p.id
    WHERE cf.hospital_id = ?
    ORDER BY cf.created_at DESC
  `).all(hospital.id);

  return NextResponse.json({ forms });
}
