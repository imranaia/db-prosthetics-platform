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

  const patients = db
    .prepare(
      `SELECT DISTINCT p.id, p.full_name, p.patient_unique_id, p.phone, p.dob, p.state, p.lga, p.created_at,
             u.email AS portal_email,
             MAX(c.created_at) AS last_consultation
       FROM patients p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN consultations c ON p.id = c.patient_id AND c.hospital_id = ?
       WHERE c.id IS NOT NULL
       GROUP BY p.id
       ORDER BY last_consultation DESC`
    )
    .all(hospital.id);

  return NextResponse.json({ patients });
}
