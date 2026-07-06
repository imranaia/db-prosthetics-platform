import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

// Public-to-patients P&O Specialist directory, used to let a patient pick a
// specific specialist when requesting a home visit (alternative to a doctor).
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const specialists = db.prepare(`
    SELECT p.id, p.full_name, p.specialization, p.state, h.name AS hospital_name
    FROM po_specialists p
    LEFT JOIN hospitals h ON p.hospital_id = h.id
    ORDER BY p.full_name
  `).all();

  return NextResponse.json(specialists);
}
