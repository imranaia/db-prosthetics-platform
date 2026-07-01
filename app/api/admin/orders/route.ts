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

  const orders = db.prepare(`
    SELECT o.*, p.full_name AS patient_name
    FROM orders o
    LEFT JOIN patients p ON o.patient_id = p.id
    ORDER BY o.created_at DESC
  `).all() as Array<Record<string, unknown>>;

  const orderItems = db.prepare(`
    SELECT oi.order_id, pr.name AS product_name, oi.quantity, oi.price_at_order
    FROM order_items oi
    LEFT JOIN products pr ON oi.product_id = pr.id
  `).all() as Array<{ order_id: number; product_name: string; quantity: number; price_at_order: number }>;

  const itemsByOrder: Record<number, typeof orderItems> = {};
  for (const item of orderItems) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }

  const result = orders.map((o) => ({
    ...o,
    items: itemsByOrder[o.id as number] ?? [],
  }));

  return NextResponse.json(result);
}
