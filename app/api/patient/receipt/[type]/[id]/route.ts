import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'patient') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, id } = await params;
  if (type !== 'order' && type !== 'custom_order') {
    return NextResponse.json({ error: 'Invalid receipt type' }, { status: 400 });
  }

  const db = getDb();
  const patient = db.prepare('SELECT id, full_name FROM patients WHERE user_id = ?').get(user.id) as { id: number; full_name: string } | undefined;
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  if (type === 'order') {
    const order = db.prepare(`
      SELECT id, total_amount, service_fee, payment_status, created_at
      FROM orders WHERE id = ? AND patient_id = ? AND payment_status = 'paid'
    `).get(id, patient.id) as { id: number; total_amount: number; service_fee: number; payment_status: string; created_at: string } | undefined;
    if (!order) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

    const items = db.prepare(`
      SELECT oi.quantity, oi.price_at_order, p.name AS product_name
      FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);

    return NextResponse.json({
      type: 'order',
      id: order.id,
      patientName: patient.full_name,
      createdAt: order.created_at,
      items,
      productTotal: order.total_amount,
      serviceFee: order.service_fee,
      grandTotal: order.total_amount + order.service_fee,
    });
  }

  const custom = db.prepare(`
    SELECT id, category, description, quoted_price, payment_status, created_at
    FROM custom_orders WHERE id = ? AND patient_id = ? AND payment_status = 'paid'
  `).get(id, patient.id) as { id: number; category: string | null; description: string; quoted_price: number | null; payment_status: string; created_at: string } | undefined;
  if (!custom) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

  return NextResponse.json({
    type: 'custom_order',
    id: custom.id,
    patientName: patient.full_name,
    createdAt: custom.created_at,
    category: custom.category,
    description: custom.description,
    productTotal: custom.quoted_price || 0,
    serviceFee: 100000,
    grandTotal: (custom.quoted_price || 0) + 100000,
  });
}
