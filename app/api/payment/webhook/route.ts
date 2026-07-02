import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  const signature = req.headers.get('x-paystack-signature') || '';
  const body = await req.text();

  // Verify webhook signature
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body) as { event: string; data: { status: string; reference: string; metadata?: { appointment_id?: number } } };

  if (event.event === 'charge.success' && event.data.status === 'success') {
    const { reference, metadata } = event.data;
    const db = getDb();

    if (metadata?.appointment_id) {
      db.prepare(`UPDATE appointments SET payment_status = 'paid', status = 'confirmed' WHERE id = ? AND paystack_ref = ?`)
        .run(metadata.appointment_id, reference);
    }
  }

  return NextResponse.json({ received: true });
}
