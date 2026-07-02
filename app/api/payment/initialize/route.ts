import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appointment_id } = await req.json() as { appointment_id?: number };

  if (!appointment_id) return NextResponse.json({ error: 'appointment_id required' }, { status: 400 });

  const db = getDb();
  const appt = db.prepare(`
    SELECT a.*, p.full_name, u.email
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE a.id = ?
  `).get(appointment_id) as any;

  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  if (appt.payment_status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 });
  if (!appt.quoted_price) return NextResponse.json({ error: 'No price set for this appointment' }, { status: 400 });

  const totalKobo = appt.quoted_price + (appt.service_fee || 100000);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/api/payment/callback`;

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: appt.email || `patient-${appt.patient_id}@dbprosthetics.com`,
      amount: totalKobo,
      reference: `appt-${appointment_id}-${Date.now()}`,
      callback_url: callbackUrl,
      metadata: {
        appointment_id,
        type: 'appointment',
      },
    }),
  });

  if (!paystackRes.ok) {
    const err = await paystackRes.json();
    console.error('[payment/initialize]', err);
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 502 });
  }

  const data = await paystackRes.json() as { data: { authorization_url: string; reference: string; access_code: string } };

  // Store reference on appointment
  db.prepare('UPDATE appointments SET paystack_ref = ? WHERE id = ?').run(data.data.reference, appointment_id);

  return NextResponse.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
}
