import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import { sendErrorAlert } from '@/lib/email';

// Every payment on the platform keeps a flat ₦1,000 (100000 kobo) on the
// main account via Paystack's subaccount split; the remainder settles to
// PAYSTACK_SUBACCOUNT_CODE. If that env var isn't set yet, we fall back to
// the pre-split behaviour (100% to the main account) rather than failing.
const PLATFORM_FLAT_FEE_KOBO = 100000;

type PaymentType = 'appointment' | 'order' | 'custom_order';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { appointment_id?: number; order_id?: number; custom_order_id?: number };
  const db = getDb();

  let type: PaymentType;
  let recordId: number;
  let totalKobo: number;
  let email: string | null;
  let patientId: number;

  if (body.appointment_id) {
    type = 'appointment';
    recordId = body.appointment_id;
    const appt = db.prepare(`
      SELECT a.*, u.email
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE a.id = ?
    `).get(recordId) as any;
    if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    if (appt.payment_status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    if (appt.payment_status === 'not_required') return NextResponse.json({ error: 'No payment is required for this appointment' }, { status: 400 });
    // quoted_price only applies to home visits — hospital visits still owe
    // the flat service fee, so don't require a quote to be set.
    totalKobo = (appt.quoted_price || 0) + (appt.service_fee || PLATFORM_FLAT_FEE_KOBO);
    if (totalKobo <= 0) return NextResponse.json({ error: 'No amount due for this appointment' }, { status: 400 });
    email = appt.email;
    patientId = appt.patient_id;
  } else if (body.order_id) {
    type = 'order';
    recordId = body.order_id;
    const order = db.prepare(`
      SELECT o.*, u.email
      FROM orders o
      JOIN patients p ON o.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE o.id = ?
    `).get(recordId) as any;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.payment_status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    // total_amount is the product cost alone — the service fee is charged
    // on top, never carved out of it, so the patient pays product + ₦1,000.
    totalKobo = order.total_amount + (order.service_fee || PLATFORM_FLAT_FEE_KOBO);
    email = order.email;
    patientId = order.patient_id;
  } else if (body.custom_order_id) {
    type = 'custom_order';
    recordId = body.custom_order_id;
    const custom = db.prepare(`
      SELECT co.*, u.email
      FROM custom_orders co
      JOIN patients p ON co.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE co.id = ?
    `).get(recordId) as any;
    if (!custom) return NextResponse.json({ error: 'Custom order not found' }, { status: 404 });
    if (custom.payment_status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    if (!custom.quoted_price) return NextResponse.json({ error: 'No price set for this custom order yet' }, { status: 400 });
    totalKobo = custom.quoted_price + PLATFORM_FLAT_FEE_KOBO;
    email = custom.email;
    patientId = custom.patient_id;
  } else {
    return NextResponse.json({ error: 'appointment_id, order_id, or custom_order_id is required' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/api/payment/callback`;
  const subaccount = process.env.PAYSTACK_SUBACCOUNT_CODE || null;
  // A split only makes sense if something is actually left over for the
  // subaccount — if the whole bill is exactly the platform's flat fee (e.g.
  // an appointment with no separate quote), transaction_charge would equal
  // amount and Paystack rejects that as an invalid split.
  const useSplit = subaccount && totalKobo > PLATFORM_FLAT_FEE_KOBO;

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email || `patient-${patientId}@dbpando.com`,
      amount: totalKobo,
      reference: `${type}-${recordId}-${Date.now()}`,
      callback_url: callbackUrl,
      metadata: { type, record_id: recordId },
      ...(useSplit ? {
        subaccount,
        transaction_charge: PLATFORM_FLAT_FEE_KOBO,
        bearer: 'subaccount', // subaccount absorbs Paystack's own fee, so the platform's ₦1,000 stays exact
      } : {}),
    }),
  });

  if (!paystackRes.ok) {
    const err = await paystackRes.json().catch(() => ({}));
    const message = err?.message || `Paystack returned HTTP ${paystackRes.status}`;
    console.error('[payment/initialize]', type, recordId, err);
    sendErrorAlert({
      message: `Paystack initialize failed for ${type} #${recordId}: ${message}`,
      routePath: '/api/payment/initialize',
      routeType: 'route',
    }).catch(() => {});
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
  }

  const data = await paystackRes.json() as { data: { authorization_url: string; reference: string; access_code: string } };

  const table = type === 'appointment' ? 'appointments' : type === 'order' ? 'orders' : 'custom_orders';
  db.prepare(`UPDATE ${table} SET paystack_ref = ? WHERE id = ?`).run(data.data.reference, recordId);

  return NextResponse.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
}
