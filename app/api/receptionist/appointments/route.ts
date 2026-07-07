import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

async function getHospital(userId: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT h.id, h.name FROM receptionists r
       JOIN hospitals h ON r.hospital_id = h.id
       WHERE r.user_id = ?`
    )
    .get(userId) as { id: number; name: string } | undefined;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'receptionist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

  const db = getDb();

  const appointments = db
    .prepare(
      `SELECT a.*, p.full_name AS patient_name, p.phone AS patient_phone, p.patient_unique_id,
              d.full_name AS doctor_name, pos.full_name AS po_specialist_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN doctors d ON a.assigned_doctor_id = d.id
       LEFT JOIN po_specialists pos ON a.assigned_po_specialist_id = pos.id
       WHERE a.assigned_hospital_id = ?
       ORDER BY a.scheduled_date ASC, a.created_at DESC`
    )
    .all(hospital.id);

  const doctors = db
    .prepare(
      `SELECT d.id, d.full_name, d.specialization
       FROM doctors d JOIN users u ON d.user_id = u.id
       WHERE d.hospital_id = ? AND u.role = 'doctor'
       ORDER BY d.full_name ASC`
    )
    .all(hospital.id);

  const poSpecialists = db
    .prepare(
      `SELECT p.id, p.full_name, p.specialization
       FROM po_specialists p JOIN users u ON p.user_id = u.id
       WHERE p.hospital_id = ? AND u.role = 'po_specialist'
       ORDER BY p.full_name ASC`
    )
    .all(hospital.id);

  return NextResponse.json({ appointments, doctors, poSpecialists });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'receptionist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

  const { patient_id, doctor_id, po_specialist_id, scheduled_date, notes } = await req.json();

  if (!patient_id) return NextResponse.json({ error: 'A patient is required.' }, { status: 400 });
  if (!scheduled_date) return NextResponse.json({ error: 'A date and time is required.' }, { status: 400 });

  const db = getDb();

  const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(patient_id);
  if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });

  if (doctor_id) {
    const doctor = db.prepare(`SELECT id FROM doctors WHERE id = ? AND hospital_id = ?`).get(doctor_id, hospital.id);
    if (!doctor) return NextResponse.json({ error: 'That doctor is not at this hospital.' }, { status: 400 });
  }
  if (po_specialist_id) {
    const specialist = db.prepare(`SELECT id FROM po_specialists WHERE id = ? AND hospital_id = ?`).get(po_specialist_id, hospital.id);
    if (!specialist) return NextResponse.json({ error: 'That P&O Specialist is not at this hospital.' }, { status: 400 });
  }

  // Walk-in / front-desk bookings are already confirmed — there's no
  // quoting or hospital-assignment step to wait on, unlike a patient's own
  // online request. A patient sees exactly one of doctor/P&O specialist.
  db.prepare(
    `INSERT INTO appointments (patient_id, type, notes, scheduled_date, assigned_hospital_id, assigned_doctor_id, assigned_po_specialist_id, status)
     VALUES (?, 'hospital', ?, ?, ?, ?, ?, 'confirmed')`
  ).run(patient_id, notes || null, scheduled_date, hospital.id, doctor_id || null, doctor_id ? null : (po_specialist_id || null));

  return NextResponse.json({ success: true }, { status: 201 });
}
