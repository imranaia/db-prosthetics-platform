import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const forms = db.prepare(`
    SELECT df.*, p.full_name AS patient_name, h.name AS hospital_name
    FROM discharge_forms df
    LEFT JOIN patients p ON df.patient_id = p.id
    LEFT JOIN hospitals h ON df.hospital_id = h.id
    ORDER BY df.created_at DESC
  `).all();

  return NextResponse.json({ forms });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    patient_id: number;
    consultation_id?: number | null;
    hospital_id?: number | null;
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

  const db = getDb();
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
      ?, ?, 'super_admin'
    )
  `).run(
    body.patient_id,
    body.consultation_id ?? null,
    body.hospital_id ?? null,
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
  );

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
