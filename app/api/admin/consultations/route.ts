import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const consultations = db.prepare(`
    SELECT
      c.id,
      c.notes,
      c.conducted_by_role,
      c.created_at,
      c.body_parts,
      c.photos,
      c.assessor_name,
      c.chief_complaint,
      c.medical_history,
      c.physical_assessment,
      c.patient_goals,
      c.recommended_device,
      c.followup_date,
      c.consent_given,
      c.assessor_signature,
      c.patient_signature,
      c.fit_for_prosthetic,
      c.unfit_diagnosis,
      c.unfit_next_steps,
      c.unfit_treatment,
      p.full_name AS patient_name,
      u.email     AS doctor_email,
      h.name      AS hospital_name,
      h.state     AS hospital_state
    FROM consultations c
    LEFT JOIN patients p   ON c.patient_id  = p.id
    LEFT JOIN doctors d    ON c.doctor_id   = d.id
    LEFT JOIN users u      ON d.user_id     = u.id
    LEFT JOIN hospitals h  ON c.hospital_id = h.id
    ORDER BY c.created_at DESC
  `).all();

  return NextResponse.json(consultations);
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { id: number; status?: string };
  if (!body.id) return NextResponse.json({ error: 'Consultation id required' }, { status: 400 });

  const db = getDb();

  if (body.status === 'completed') {
    const consultation = db.prepare('SELECT conducted_by_role FROM consultations WHERE id = ?').get(body.id) as
      { conducted_by_role: string } | undefined;
    if (!consultation) return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    if (consultation.conducted_by_role !== 'super_admin') {
      return NextResponse.json({ error: 'Only the consulting practitioner can mark this complete.' }, { status: 403 });
    }
  }

  const setClauses: string[] = [];
  const values: (string | number)[] = [];
  if (body.status !== undefined) { setClauses.push('status = ?'); values.push(body.status); }

  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  values.push(body.id);
  db.prepare(`UPDATE consultations SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    patient_id: number;
    hospital_id?: number | null;
    assessor_name?: string;
    chief_complaint?: string;
    medical_history?: string;
    physical_assessment?: Record<string, unknown> | string;
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

  const {
    patient_id,
    hospital_id,
    assessor_name,
    chief_complaint,
    medical_history,
    physical_assessment,
    patient_goals,
    recommended_device,
    followup_date,
    notes,
    consent_given,
    assessor_signature,
    patient_signature,
    consultation_type,
    category,
    device_subtype,
    body_parts,
    photos,
    fit_for_prosthetic,
    unfit_diagnosis,
    unfit_next_steps,
    unfit_treatment,
  } = body;

  // Require at least patient_id and (chief_complaint or notes)
  if (!patient_id) {
    return NextResponse.json({ error: 'Patient is required.' }, { status: 400 });
  }
  if (!chief_complaint?.trim() && !notes?.trim()) {
    return NextResponse.json({ error: 'Chief complaint or notes is required.' }, { status: 400 });
  }

  // Normalise JSON fields to strings
  const bodyPartsStr = body_parts
    ? (typeof body_parts === 'string' ? body_parts : JSON.stringify(body_parts))
    : null;
  const photosStr = photos
    ? (typeof photos === 'string' ? photos : JSON.stringify(photos))
    : null;
  const physicalAssessmentStr = physical_assessment
    ? (typeof physical_assessment === 'string' ? physical_assessment : JSON.stringify(physical_assessment))
    : null;

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO consultations (
      patient_id,
      doctor_id,
      conducted_by_role,
      hospital_id,
      assessor_name,
      chief_complaint,
      medical_history,
      physical_assessment,
      patient_goals,
      recommended_device,
      followup_date,
      notes,
      consent_given,
      assessor_signature,
      patient_signature,
      consultation_type,
      category,
      device_subtype,
      body_parts,
      photos,
      fit_for_prosthetic,
      unfit_diagnosis,
      unfit_next_steps,
      unfit_treatment
    ) VALUES (?, NULL, 'super_admin', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    patient_id,
    hospital_id ?? null,
    assessor_name?.trim() || null,
    chief_complaint?.trim() || null,
    medical_history?.trim() || null,
    physicalAssessmentStr,
    patient_goals?.trim() || null,
    recommended_device?.trim() || null,
    followup_date || null,
    notes?.trim() || null,
    consent_given ?? 0,
    assessor_signature ?? null,
    patient_signature ?? null,
    consultation_type === 'follow_up' ? 'follow_up' : 'new',
    category ?? null,
    device_subtype ?? null,
    bodyPartsStr,
    photosStr,
    fit_for_prosthetic ?? null,
    unfit_diagnosis?.trim() || null,
    unfit_next_steps?.trim() || null,
    unfit_treatment?.trim() || null,
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}
