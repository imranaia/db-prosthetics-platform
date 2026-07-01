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

  const hospitals         = (db.prepare('SELECT COUNT(*) as count FROM hospitals').get() as { count: number }).count;
  const patients          = (db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number }).count;
  const doctors           = (db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number }).count;
  const pending_orders    = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as { count: number }).count;
  const pending_appointments = (db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'requested'").get() as { count: number }).count;
  const products          = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;

  return NextResponse.json({ hospitals, patients, doctors, pending_orders, pending_appointments, products });
}
