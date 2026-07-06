import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

// Rolling lookback windows, in days, for the income range filter — simpler
// and less error-prone than calendar-aligned quarters/half-years in SQLite.
const RANGE_DAYS: Record<string, number | null> = {
  today: 0,
  week: 7,
  month: 30,
  quarter: 90,
  half_year: 182,
  year: 365,
  all: null,
};

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

  // "Income" here deliberately excludes the platform's own flat service fee
  // (orders.service_fee) — Super Admin should see what the business earned
  // from device sales, not the platform's own cut on top of that.
  const rangeParam = req.nextUrl.searchParams.get('range') || 'all';
  const days = rangeParam in RANGE_DAYS ? RANGE_DAYS[rangeParam] : null;
  const sinceClause = days === null ? '' : days === 0 ? "AND date(created_at) = date('now')" : `AND created_at >= date('now', '-${days} days')`;

  const income = (db.prepare(
    `SELECT COALESCE(SUM(total_amount - service_fee),0) as s FROM orders WHERE payment_status='paid' ${sinceClause}`
  ).get() as { s: number }).s;

  // Potential income: value of everything currently in stock, if all of it sold.
  const potential_income = (db.prepare(
    `SELECT COALESCE(SUM(price),0) as s FROM products WHERE in_stock = 1`
  ).get() as { s: number }).s;

  // Monthly revenue — last 6 months (in kobo, divide by 100 on client),
  // also excluding the platform's service fee.
  const monthly_revenue = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month,
           COALESCE(SUM(total_amount - service_fee),0) as revenue
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
    income,
    income_range: rangeParam,
    potential_income,
    monthly_revenue,
    orders_by_status,
    patient_growth,
  });
}
