import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || (user.role !== 'doctor' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const doctor = db
    .prepare('SELECT id, hospital_id FROM doctors WHERE user_id = ?')
    .get(user.id) as { id: number; hospital_id: number } | undefined;

  if (!doctor) {
    return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
  }

  const appointments = db
    .prepare(
      `SELECT a.*, p.full_name AS patient_name, p.phone AS patient_phone
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.assigned_doctor_id = ?
          OR (a.type = 'hospital' AND a.assigned_hospital_id = ?)
       ORDER BY a.created_at DESC`
    )
    .all(doctor.id, doctor.hospital_id);

  return NextResponse.json({ appointments, doctorId: doctor.id });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || (user.role !== 'doctor' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const doctor = db
    .prepare('SELECT id FROM doctors WHERE user_id = ?')
    .get(user.id) as { id: number } | undefined;

  if (!doctor) {
    return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
  }

  const body = await req.json() as { id: number; status?: string };
  if (!body.id) return NextResponse.json({ error: 'Appointment id required' }, { status: 400 });

  const appointment = db
    .prepare('SELECT assigned_doctor_id, payment_status FROM appointments WHERE id = ?')
    .get(body.id) as { assigned_doctor_id: number | null; payment_status: string } | undefined;

  if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  if (appointment.assigned_doctor_id !== doctor.id) {
    return NextResponse.json({ error: 'Only the assigned doctor can update this appointment.' }, { status: 403 });
  }

  if (body.status === undefined) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  if (body.status === 'completed' && appointment.payment_status === 'unpaid') {
    return NextResponse.json({ error: 'This appointment has an unpaid bill. It must be paid before it can be marked complete.' }, { status: 400 });
  }

  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(body.status, body.id);

  return NextResponse.json({ success: true });
}
