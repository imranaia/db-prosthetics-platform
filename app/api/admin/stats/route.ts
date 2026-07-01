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

  const hospitals            = (db.prepare('SELECT COUNT(*) as c FROM hospitals').get() as { c: number }).c;
  const patients             = (db.prepare('SELECT COUNT(*) as c FROM patients').get() as { c: number }).c;
  const doctors              = (db.prepare('SELECT COUNT(*) as c FROM doctors').get() as { c: number }).c;
  const pending_orders       = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get() as { c: number }).c;
  const pending_appointments = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'requested'").get() as { c: number }).c;
  const products             = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  const total_revenue        = (db.prepare("SELECT COALESCE(SUM(total_amount),0) as s FROM orders WHERE payment_status='paid'").get() as { s: number }).s;

  // Monthly revenue — last 6 months (in kobo, divide by 100 on client)
  const monthly_revenue = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month,
           COALESCE(SUM(total_amount),0) as revenue
    FROM orders
    WHERE payment_status = 'paid'
      AND created_at >= date('now', '-6 months')
    GROUP BY month ORDER BY month ASC
  `).all() as { month: string; revenue: number }[];

  // Orders by status
  const orders_by_status = db.prepare(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `).all() as { status: string; count: number }[];

  // New patients per month — last 6 months
  const patient_growth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM patients
    WHERE created_at >= date('now', '-6 months')
    GROUP BY month ORDER BY month ASC
  `).all() as { month: string; count: number }[];

  return NextResponse.json({
    hospitals, patients, doctors,
    pending_orders, pending_appointments, products,
    total_revenue,
    monthly_revenue,
    orders_by_status,
    patient_growth,
  });
}
