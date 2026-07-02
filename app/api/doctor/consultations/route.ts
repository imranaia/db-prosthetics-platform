import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'doctor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const doctor = db
    .prepare('SELECT id, hospital_id FROM doctors WHERE user_id = ?')
    .get(user.id) as { id: number; hospital_id: number } | undefined;

  if (!doctor) {
    return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
  }

  const consultations = db
    .prepare(
      `SELECT c.*, p.full_name AS patient_name
       FROM consultations c
       LEFT JOIN patients p ON c.patient_id = p.id
       WHERE c.doctor_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(doctor.id);

  // All patients at this hospital (for the new-consultation form dropdown)
  const patients = db
    .prepare(
      `SELECT DISTINCT p.id, p.full_name
       FROM patients p
       LEFT JOIN consultations c ON p.id = c.patient_id
       LEFT JOIN appointments a ON p.id = a.patient_id
       WHERE c.hospital_id = ? OR a.assigned_hospital_id = ?
       ORDER BY p.full_name ASC`
    )
    .all(doctor.hospital_id, doctor.hospital_id);

  return NextResponse.json({ consultations, patients });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'doctor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const doctor = db
    .prepare('SELECT id, hospital_id FROM doctors WHERE user_id = ?')
    .get(user.id) as { id: number; hospital_id: number } | undefined;

  if (!doctor) {
    return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
  }

  const body = await req.json() as {
    patient_id: number;
    assessor_name?: string;
    chief_complaint?: string;
    medical_history?: string;
    physical_assessment?: Record<string, unknown>;
    patient_goals?: string;
    recommended_device?: string;
    followup_date?: string | null;
    notes?: string;
    consent_given?: number;
    body_parts?: unknown;
    photos?: unknown;
  };

  if (!body.patient_id) {
    return NextResponse.json({ error: 'Patient is required.' }, { status: 400 });
  }
  if (!body.chief_complaint?.trim() && !body.notes?.trim()) {
    return NextResponse.json({ error: 'Chief complaint or notes is required.' }, { status: 400 });
  }

  const bodyPartsStr = body.body_parts
    ? (typeof body.body_parts === 'string' ? body.body_parts : JSON.stringify(body.body_parts))
    : null;
  const photosStr = body.photos
    ? (typeof body.photos === 'string' ? body.photos : JSON.stringify(body.photos))
    : null;
  const physicalAssessmentStr = body.physical_assessment
    ? JSON.stringify(body.physical_assessment)
    : null;

  db.prepare(`
    INSERT INTO consultations (
      patient_id, doctor_id, conducted_by_role, hospital_id,
      assessor_name, chief_complaint, medical_history, physical_assessment,
      patient_goals, recommended_device, followup_date, notes, consent_given,
      body_parts, photos
    ) VALUES (?, ?, 'doctor', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.patient_id,
    doctor.id,
    doctor.hospital_id,
    body.assessor_name?.trim() || null,
    body.chief_complaint?.trim() || null,
    body.medical_history?.trim() || null,
    physicalAssessmentStr,
    body.patient_goals?.trim() || null,
    body.recommended_device?.trim() || null,
    body.followup_date || null,
    body.notes?.trim() || null,
    body.consent_given ?? 0,
    bodyPartsStr,
    photosStr,
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
