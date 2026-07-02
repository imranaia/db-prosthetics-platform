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

  const forms = db.prepare(`
    SELECT df.*, p.full_name AS patient_name
    FROM discharge_forms df
    LEFT JOIN patients p ON df.patient_id = p.id
    WHERE df.hospital_id = ?
    ORDER BY df.created_at DESC
  `).all(hospital.id);

  return NextResponse.json({ forms });
}
