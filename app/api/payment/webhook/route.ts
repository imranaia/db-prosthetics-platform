import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import getDb from '@/lib/db';
import { sendOrderReceiptEmail } from '@/lib/receipt-notify';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  const signature = req.headers.get('x-paystack-signature') || '';
  const body = await req.text();

  // Verify webhook signature
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: { status: string; reference: string; metadata?: { type?: string; record_id?: number; appointment_id?: number } };
  };

  if (event.event === 'charge.success' && event.data.status === 'success') {
    const { reference, metadata } = event.data;
    const db = getDb();

    // metadata.appointment_id is the legacy shape from before orders/custom
    // orders were wired up — kept so in-flight transactions still resolve.
    const type = metadata?.type || (metadata?.appointment_id ? 'appointment' : null);
    const recordId = metadata?.record_id ?? metadata?.appointment_id;

    if (type === 'appointment' && recordId) {
      db.prepare(`UPDATE appointments SET payment_status = 'paid', status = 'confirmed' WHERE id = ? AND paystack_ref = ?`)
        .run(recordId, reference);
    } else if (type === 'order' && recordId) {
      const before = db.prepare('SELECT payment_status FROM orders WHERE id = ?').get(recordId) as { payment_status: string } | undefined;
      db.prepare(`UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ? AND paystack_ref = ?`)
        .run(recordId, reference);
      if (before && before.payment_status !== 'paid') await sendOrderReceiptEmail(db, 'order', recordId);
    } else if (type === 'custom_order' && recordId) {
      const before = db.prepare('SELECT payment_status FROM custom_orders WHERE id = ?').get(recordId) as { payment_status: string } | undefined;
      db.prepare(`UPDATE custom_orders SET payment_status = 'paid', status = 'paid' WHERE id = ? AND paystack_ref = ?`)
        .run(recordId, reference);
      if (before && before.payment_status !== 'paid') await sendOrderReceiptEmail(db, 'custom_order', recordId);
    }
  }

  return NextResponse.json({ received: true });
}
