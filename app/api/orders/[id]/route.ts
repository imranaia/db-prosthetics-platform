import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

// PATCH: allows doctor or patient to update fulfillment_status on their own orders
// Doctor can set: received_by_doctor
// Patient can set: received_by_patient
// Verify the order belongs to the caller
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { fulfillment_status: string };

  if (!body.fulfillment_status) {
    return NextResponse.json({ error: 'fulfillment_status is required' }, { status: 400 });
  }

  const db = getDb();

  if (user.role === 'doctor') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    if (body.fulfillment_status !== 'received_by_doctor') {
      return NextResponse.json({ error: 'Doctors can only set received_by_doctor.' }, { status: 403 });
    }

    // Verify the order was created by this doctor
    const order = db.prepare(
      "SELECT id FROM orders WHERE id = ? AND created_by_role = 'doctor' AND created_by_id = ?"
    ).get(id, doctor.id);
    if (!order) return NextResponse.json({ error: 'Order not found or access denied.' }, { status: 404 });

    db.prepare('UPDATE orders SET fulfillment_status = ? WHERE id = ?').run(body.fulfillment_status, id);
    return NextResponse.json({ success: true });
  }

  if (user.role === 'patient') {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    if (body.fulfillment_status !== 'received_by_patient') {
      return NextResponse.json({ error: 'Patients can only set received_by_patient.' }, { status: 403 });
    }

    // Verify the order belongs to this patient
    const order = db.prepare('SELECT id FROM orders WHERE id = ? AND patient_id = ?').get(id, patient.id);
    if (!order) return NextResponse.json({ error: 'Order not found or access denied.' }, { status: 404 });

    db.prepare('UPDATE orders SET fulfillment_status = ? WHERE id = ?').run(body.fulfillment_status, id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
