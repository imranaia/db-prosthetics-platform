import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'po_specialist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const patients = db.prepare(`
    SELECT DISTINCT p.id, p.full_name, p.patient_unique_id, p.phone, p.state, p.lga, p.dob,
           u.email AS portal_email, MAX(o.created_at) AS last_order
    FROM patients p
    LEFT JOIN users u ON p.user_id = u.id
    JOIN orders o ON p.id = o.patient_id
    WHERE o.po_specialist_id = (SELECT id FROM po_specialists WHERE user_id = ?)
    GROUP BY p.id
    ORDER BY last_order DESC
  `).all(user.id);

  return NextResponse.json({ patients });
}
