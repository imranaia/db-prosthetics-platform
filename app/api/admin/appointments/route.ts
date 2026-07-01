import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const appointments = db.prepare(`
    SELECT a.*, p.full_name AS patient_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    ORDER BY a.created_at DESC
  `).all();

  return NextResponse.json(appointments);
}
