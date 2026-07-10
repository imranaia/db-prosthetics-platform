import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

type Practitioner = { id: number; role: 'doctor' | 'po_specialist' };

function getPractitioner(db: ReturnType<typeof getDb>, userId: number, role: string): Practitioner | undefined {
  // A Super Admin using "Doctor Mode" has a real doctors row keyed by their
  // own user_id — treat them exactly like a doctor here, same as before
  // P&O parity was added (which is what broke this).
  if (role === 'doctor' || role === 'super_admin') {
    const row = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(userId) as { id: number } | undefined;
    return row ? { id: row.id, role: 'doctor' } : undefined;
  }
  if (role === 'po_specialist') {
    const row = db.prepare('SELECT id FROM po_specialists WHERE user_id = ?').get(userId) as { id: number } | undefined;
    return row ? { id: row.id, role: 'po_specialist' } : undefined;
  }
  return undefined;
}

function isAuthorized(role: string): boolean {
  return role === 'doctor' || role === 'po_specialist' || role === 'super_admin';
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || !isAuthorized(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const practitioner = getPractitioner(db, user.id, user.role);
  if (!practitioner) {
    return NextResponse.json({ error: 'Practitioner record not found' }, { status: 404 });
  }

  const idColumn = practitioner.role === 'doctor' ? 'doctor_id' : 'po_specialist_id';

  const consultations = db
    .prepare(
      `SELECT c.*, p.full_name AS patient_name
       FROM consultations c
       LEFT JOIN patients p ON c.patient_id = p.id
       WHERE c.${idColumn} = ?
       ORDER BY c.created_at DESC`
    )
    .all(practitioner.id);

  // Patients for the new-consultation form dropdown. If a hospital is picked
  // in the form, scope to patients associated with that hospital; if
  // Personal (no hospital_id param), show every patient.
  const hospitalIdParam = req.nextUrl.searchParams.get('hospital_id');
  const hospitalId = hospitalIdParam ? parseInt(hospitalIdParam) : null;

  const patients = hospitalId
    ? db
        .prepare(
          `SELECT DISTINCT p.id, p.full_name, p.patient_unique_id
           FROM patients p
           LEFT JOIN consultations c ON p.id = c.patient_id
           LEFT JOIN appointments a ON p.id = a.patient_id
           WHERE c.hospital_id = ? OR a.assigned_hospital_id = ?
           ORDER BY p.full_name ASC`
        )
        .all(hospitalId, hospitalId)
    : db.prepare(`SELECT id, full_name, patient_unique_id FROM patients ORDER BY full_name ASC`).all();

  const hospitals = db.prepare('SELECT id, name FROM hospitals ORDER BY name ASC').all();

  return NextResponse.json({ consultations, patients, hospitals });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || !isAuthorized(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const practitioner = getPractitioner(db, user.id, user.role);
  if (!practitioner) {
    return NextResponse.json({ error: 'Practitioner record not found' }, { status: 404 });
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
    device_subtype?: string | null;
    body_parts?: unknown;
    photos?: unknown;
    fit_for_prosthetic?: 'fit' | 'not_fit' | null;
    unfit_diagnosis?: string | null;
    unfit_next_steps?: string | null;
    unfit_treatment?: string | null;
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

  const doctorId = practitioner.role === 'doctor' ? practitioner.id : null;
  const poSpecialistId = practitioner.role === 'po_specialist' ? practitioner.id : null;

  const result = db.prepare(`
    INSERT INTO consultations (
      patient_id, doctor_id, po_specialist_id, conducted_by_role, hospital_id,
      assessor_name, chief_complaint, medical_history, physical_assessment,
      patient_goals, recommended_device, followup_date, notes, consent_given,
      assessor_signature, patient_signature, consultation_type, category, device_subtype,
      body_parts, photos, fit_for_prosthetic, unfit_diagnosis, unfit_next_steps, unfit_treatment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.patient_id,
    doctorId,
    poSpecialistId,
    practitioner.role,
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
    body.device_subtype ?? null,
    bodyPartsStr,
    photosStr,
    body.fit_for_prosthetic ?? null,
    body.unfit_diagnosis?.trim() || null,
    body.unfit_next_steps?.trim() || null,
    body.unfit_treatment?.trim() || null,
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
}
