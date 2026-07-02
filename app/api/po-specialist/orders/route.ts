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

  const orders = db.prepare(`
    SELECT o.id, o.status, o.total_amount, o.payment_status, o.payment_method, o.created_at,
           p.full_name AS patient_name,
           h.name AS hospital_name
    FROM orders o
    LEFT JOIN patients p ON o.patient_id = p.id
    LEFT JOIN hospitals h ON o.hospital_id = h.id
    WHERE o.po_specialist_id = (SELECT id FROM po_specialists WHERE user_id = ?)
    ORDER BY o.created_at DESC
  `).all(user.id) as Array<{
    id: number;
    status: string;
    total_amount: number;
    payment_status: string;
    payment_method: string;
    created_at: string;
    patient_name: string;
    hospital_name: string;
    items?: Array<{ product_name: string; quantity: number; price_at_order: number }>;
  }>;

  const orderItems = db.prepare(`
    SELECT oi.order_id, pr.name AS product_name, oi.quantity, oi.price_at_order
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN products pr ON oi.product_id = pr.id
    WHERE o.po_specialist_id = (SELECT id FROM po_specialists WHERE user_id = ?)
  `).all(user.id) as Array<{ order_id: number; product_name: string; quantity: number; price_at_order: number }>;

  // Merge items into orders
  const itemsByOrder = new Map<number, typeof orderItems>();
  for (const item of orderItems) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
    itemsByOrder.get(item.order_id)!.push(item);
  }

  const merged = orders.map(o => ({ ...o, items: itemsByOrder.get(o.id) || [] }));

  return NextResponse.json({ orders: merged });
}
