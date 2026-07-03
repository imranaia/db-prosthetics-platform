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
    .prepare('SELECT id FROM doctors WHERE user_id = ?')
    .get(user.id) as { id: number } | undefined;

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

  // Patients for the new-consultation form dropdown. If a hospital is picked
  // in the form, scope to patients associated with that hospital; if
  // Personal (no hospital_id param), show every patient.
  const hospitalIdParam = req.nextUrl.searchParams.get('hospital_id');
  const hospitalId = hospitalIdParam ? parseInt(hospitalIdParam) : null;

  const patients = hospitalId
    ? db
        .prepare(
          `SELECT DISTINCT p.id, p.full_name
           FROM patients p
           LEFT JOIN consultations c ON p.id = c.patient_id
           LEFT JOIN appointments a ON p.id = a.patient_id
           WHERE c.hospital_id = ? OR a.assigned_hospital_id = ?
           ORDER BY p.full_name ASC`
        )
        .all(hospitalId, hospitalId)
    : db.prepare(`SELECT id, full_name FROM patients ORDER BY full_name ASC`).all();

  const hospitals = db.prepare('SELECT id, name FROM hospitals ORDER BY name ASC').all();

  return NextResponse.json({ consultations, patients, hospitals });
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

  if (!doctor) return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });

  const body = await req.json() as { id: number; status?: string };
  if (!body.id) return NextResponse.json({ error: 'Consultation id required' }, { status: 400 });

  if (body.status === 'completed') {
    const consultation = db
      .prepare('SELECT doctor_id, conducted_by_role FROM consultations WHERE id = ?')
      .get(body.id) as { doctor_id: number | null; conducted_by_role: string } | undefined;
    if (!consultation) return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    if (consultation.conducted_by_role !== 'doctor' || consultation.doctor_id !== doctor.id) {
      return NextResponse.json({ error: 'Only the consulting practitioner can mark this complete.' }, { status: 403 });
    }
  }

  const setClauses: string[] = [];
  const values: (string | number)[] = [];
  if (body.status !== undefined) { setClauses.push('status = ?'); values.push(body.status); }

  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  values.push(body.id);
  db.prepare(`UPDATE consultations SET ${setClauses.join(', ')} WHERE id = ? AND doctor_id = ?`).run(...values, doctor.id);

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
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

  const body = await req.json() as {
    patient_id: number;
    hospital_id?: number | null;
    assessor_name?: string;
    chief_complaint?: string;
    medical_history?: string;
    physical_assessment?: Record<string, unknown>;
    patient_goals?: string;
    recommended_device?: string;
    followup_date?: string | null;
    notes?: string;
    consent_given?: number;
    assessor_signature?: string | null;
    patient_signature?: string | null;
    consultation_type?: string;
    category?: string | null;
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

  const result = db.prepare(`
    INSERT INTO consultations (
      patient_id, doctor_id, conducted_by_role, hospital_id,
      assessor_name, chief_complaint, medical_history, physical_assessment,
      patient_goals, recommended_device, followup_date, notes, consent_given,
      assessor_signature, patient_signature, consultation_type, category,
      body_parts, photos
    ) VALUES (?, ?, 'doctor', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.patient_id,
    doctor.id,
    body.hospital_id ?? null,
    body.assessor_name?.trim() || null,
    body.chief_complaint?.trim() || null,
    body.medical_history?.trim() || null,
    physicalAssessmentStr,
    body.patient_goals?.trim() || null,
    body.recommended_device?.trim() || null,
    body.followup_date || null,
    body.notes?.trim() || null,
    body.consent_given ?? 0,
    body.assessor_signature ?? null,
    body.patient_signature ?? null,
    body.consultation_type === 'follow_up' ? 'follow_up' : 'new',
    body.category ?? null,
    bodyPartsStr,
    photosStr,
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
}
