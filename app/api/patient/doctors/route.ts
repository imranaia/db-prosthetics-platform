import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

// Public-to-patients doctor directory, used to let a patient pick a
// specific doctor when requesting a home visit.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const doctors = db.prepare(`
    SELECT d.id, d.full_name, d.specialization, d.state, h.name AS hospital_name
    FROM doctors d
    LEFT JOIN hospitals h ON d.hospital_id = h.id
    ORDER BY d.full_name
  `).all();

  return NextResponse.json(doctors);
}
