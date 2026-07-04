import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

const REDIRECT_PATH: Record<string, string> = {
  appointment: '/dashboard/patient/appointments',
  order: '/dashboard/patient/orders',
  custom_order: '/dashboard/patient/orders',
};

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!ref) return NextResponse.redirect(`${baseUrl}/dashboard/patient/appointments?payment=failed`);

  // Verify with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });

  if (!verifyRes.ok) return NextResponse.redirect(`${baseUrl}/dashboard/patient/appointments?payment=failed`);

  const result = await verifyRes.json() as { data: { status: string; metadata: { type?: string; record_id?: number; appointment_id?: number } } };

  if (result.data.status !== 'success') {
    return NextResponse.redirect(`${baseUrl}/dashboard/patient/appointments?payment=failed`);
  }

  const db = getDb();
  // metadata.appointment_id is the legacy shape from before orders/custom
  // orders were wired up — kept so in-flight transactions from before this
  // change still resolve correctly.
  const type = result.data.metadata.type || (result.data.metadata.appointment_id ? 'appointment' : null);
  const recordId = result.data.metadata.record_id ?? result.data.metadata.appointment_id;

  if (type && recordId) {
    if (type === 'appointment') {
      db.prepare(`UPDATE appointments SET payment_status = 'paid', status = 'confirmed' WHERE id = ? AND paystack_ref = ?`).run(recordId, ref);
    } else if (type === 'order') {
      db.prepare(`UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ? AND paystack_ref = ?`).run(recordId, ref);
    } else if (type === 'custom_order') {
      db.prepare(`UPDATE custom_orders SET payment_status = 'paid', status = 'paid' WHERE id = ? AND paystack_ref = ?`).run(recordId, ref);
    }
  }

  const dest = REDIRECT_PATH[type || 'appointment'] || '/dashboard/patient/appointments';
  return NextResponse.redirect(`${baseUrl}${dest}?payment=success`);
}
