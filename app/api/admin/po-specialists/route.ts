import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

// Directory used by the super-admin appointments page to assign a P&O
// Specialist to a home-visit request (parallel to /api/admin/doctors).
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const specialists = db.prepare(`
    SELECT p.id, p.full_name, p.specialization, p.state, p.phone,
           u.email, h.name AS hospital_name
    FROM po_specialists p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN hospitals h ON p.hospital_id = h.id
    ORDER BY p.full_name
  `).all();

  return NextResponse.json(specialists);
}
