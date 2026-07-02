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

  const patientsRow = db.prepare(
    `SELECT COUNT(DISTINCT patient_id) AS count FROM orders WHERE po_specialist_id = (SELECT id FROM po_specialists WHERE user_id = ?)`
  ).get(user.id) as { count: number };

  const ordersRow = db.prepare(
    `SELECT COUNT(*) AS count FROM orders WHERE po_specialist_id = (SELECT id FROM po_specialists WHERE user_id = ?)`
  ).get(user.id) as { count: number };

  const pendingRow = db.prepare(
    `SELECT COUNT(*) AS count FROM orders WHERE po_specialist_id = (SELECT id FROM po_specialists WHERE user_id = ?) AND status = 'pending'`
  ).get(user.id) as { count: number };

  return NextResponse.json({
    stats: {
      patients: patientsRow?.count ?? 0,
      orders: ordersRow?.count ?? 0,
      pending_orders: pendingRow?.count ?? 0,
    },
  });
}
