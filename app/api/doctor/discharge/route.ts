import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

type Practitioner = { id: number; role: 'doctor' | 'po_specialist' };

function getPractitioner(db: ReturnType<typeof getDb>, userId: number, role: string): Practitioner | undefined {
  if (role === 'doctor') {
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
  if (!practitioner) return NextResponse.json({ error: 'Practitioner record not found' }, { status: 404 });

  const idColumn = practitioner.role === 'doctor' ? 'doctor_id' : 'po_specialist_id';

  // Discharge forms for patients this practitioner has actually consulted.
  const forms = db.prepare(`
    SELECT DISTINCT df.*, p.full_name AS patient_name, h.name AS hospital_name
    FROM discharge_forms df
    LEFT JOIN patients p ON df.patient_id = p.id
    LEFT JOIN hospitals h ON df.hospital_id = h.id
    WHERE df.patient_id IN (
      SELECT DISTINCT patient_id FROM consultations WHERE ${idColumn} = ?
    )
    ORDER BY df.created_at DESC
  `).all(practitioner.id);

  return NextResponse.json({ forms });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || !isAuthorized(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const practitioner = getPractitioner(db, user.id, user.role);
  if (!practitioner) return NextResponse.json({ error: 'Practitioner record not found' }, { status: 404 });

  const idColumn = practitioner.role === 'doctor' ? 'doctor_id' : 'po_specialist_id';

  const body = await req.json() as {
    patient_id: number;
    consultation_id?: number | null;
    device_fit?: string;
    alignment_function?: string;
    skin_condition?: string;
    pain_discomfort?: string;
    gait_mobility?: string;
    patient_satisfaction?: string;
    training_donning?: number;
    training_care?: number;
    training_skin?: number;
    training_troubleshooting?: number;
    discharge_date?: string;
    discharge_reason?: string;
    followup_recommended?: number;
    next_appointment?: string;
    prosthetist_name?: string;
    patient_signature_name?: string;
    prosthetist_signature?: string | null;
    patient_signature?: string | null;
  };

  if (!body.patient_id) {
    return NextResponse.json({ error: 'patient_id is required' }, { status: 400 });
  }

  // A practitioner may only create discharge forms for patients they've
  // actually consulted — mirrors the scoping already enforced on GET above.
  const hasConsulted = db.prepare(
    `SELECT 1 FROM consultations WHERE ${idColumn} = ? AND patient_id = ? LIMIT 1`
  ).get(practitioner.id, body.patient_id);
  if (!hasConsulted) {
    return NextResponse.json({ error: 'You can only create discharge forms for patients you have consulted.' }, { status: 403 });
  }

  // Hospital attribution follows the linked consultation (chosen there as a
  // hospital or Personal) rather than a fixed hospital on the practitioner
  // record. The consultation must also belong to this practitioner, or its
  // hospital_id could be inherited from an unrelated consultation.
  let hospitalId: number | null = null;
  if (body.consultation_id) {
    const consultation = db.prepare(
      `SELECT hospital_id FROM consultations WHERE id = ? AND ${idColumn} = ?`
    ).get(body.consultation_id, practitioner.id) as { hospital_id: number | null } | undefined;
    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found or does not belong to you.' }, { status: 403 });
    }
    hospitalId = consultation.hospital_id ?? null;
  }

  const result = db.prepare(`
    INSERT INTO discharge_forms (
      patient_id, consultation_id, hospital_id,
      device_fit, alignment_function, skin_condition,
      pain_discomfort, gait_mobility, patient_satisfaction,
      training_donning, training_care, training_skin, training_troubleshooting,
      discharge_date, discharge_reason, followup_recommended, next_appointment,
      prosthetist_name, patient_signature_name,
      prosthetist_signature, patient_signature, conducted_by_role
    ) VALUES (
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?
    )
  `).run(
    body.patient_id,
    body.consultation_id ?? null,
    hospitalId,
    body.device_fit ?? null,
    body.alignment_function ?? null,
    body.skin_condition ?? null,
    body.pain_discomfort ?? null,
    body.gait_mobility ?? null,
    body.patient_satisfaction ?? null,
    body.training_donning ?? 0,
    body.training_care ?? 0,
    body.training_skin ?? 0,
    body.training_troubleshooting ?? 0,
    body.discharge_date ?? null,
    body.discharge_reason ?? null,
    body.followup_recommended ?? 0,
    body.next_appointment ?? null,
    body.prosthetist_name ?? null,
    body.patient_signature_name ?? null,
    body.prosthetist_signature ?? null,
    body.patient_signature ?? null,
    practitioner.role,
  );

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
