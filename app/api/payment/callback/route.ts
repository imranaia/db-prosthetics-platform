import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!ref) return NextResponse.redirect(`${baseUrl}/dashboard/patient/appointments?payment=failed`);

  // Verify with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });

  if (!verifyRes.ok) return NextResponse.redirect(`${baseUrl}/dashboard/patient/appointments?payment=failed`);

  const result = await verifyRes.json() as { data: { status: string; metadata: { appointment_id?: number; type?: string } } };

  if (result.data.status !== 'success') {
    return NextResponse.redirect(`${baseUrl}/dashboard/patient/appointments?payment=failed`);
  }

  const db = getDb();
  const { appointment_id } = result.data.metadata;

  if (appointment_id) {
    db.prepare(`UPDATE appointments SET payment_status = 'paid', status = 'confirmed' WHERE id = ? AND paystack_ref = ?`).run(appointment_id, ref);
  }

  return NextResponse.redirect(`${baseUrl}/dashboard/patient/appointments?payment=success`);
}
