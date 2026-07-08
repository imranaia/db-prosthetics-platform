import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

type Practitioner = { id: number | null; role: 'doctor' | 'po_specialist' | 'super_admin' };

function getPractitioner(db: ReturnType<typeof getDb>, userId: number, role: string): Practitioner | undefined {
  if (role === 'doctor') {
    const row = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(userId) as { id: number } | undefined;
    return row ? { id: row.id, role: 'doctor' } : undefined;
  }
  if (role === 'po_specialist') {
    const row = db.prepare('SELECT id FROM po_specialists WHERE user_id = ?').get(userId) as { id: number } | undefined;
    return row ? { id: row.id, role: 'po_specialist' } : undefined;
  }
  if (role === 'super_admin') {
    return { id: null, role: 'super_admin' };
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const consultationId = req.nextUrl.searchParams.get('consultation_id');
  if (!consultationId) return NextResponse.json({ error: 'consultation_id is required.' }, { status: 400 });

  const db = getDb();

  // Pull the consultation's own body-part selections (Section 2 equivalent)
  // and patient identity, so the measurement form doesn't re-ask for either.
  const consultation = db.prepare(`
    SELECT c.id, c.body_parts, c.assessor_name, c.patient_id, c.category,
           p.full_name AS patient_name, p.dob AS patient_dob, p.amputation_date AS patient_amputation_date
    FROM consultations c
    LEFT JOIN patients p ON c.patient_id = p.id
    WHERE c.id = ?
  `).get(consultationId);

  if (!consultation) return NextResponse.json({ error: 'Consultation not found.' }, { status: 404 });

  const existing = db.prepare('SELECT * FROM prosthetic_measurements WHERE consultation_id = ?').get(consultationId);

  return NextResponse.json({ consultation, measurement: existing ?? null });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || !['doctor', 'po_specialist', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const practitioner = getPractitioner(db, user.id, user.role);
  if (!practitioner) return NextResponse.json({ error: 'Practitioner record not found' }, { status: 404 });

  const body = await req.json() as {
    consultation_id: number;
    patient_id: number;
    amputation_date?: string | null;
    cause_of_limb_loss?: string | null;
    cause_other_detail?: string | null;
    limb_shape_profile?: string | null;
    residual_limb_length_cm?: number | null;
    sound_limb_length_cm?: number | null;
    circumference_joint_line_cm?: number | null;
    circumference_interval_1_cm?: number | null;
    circumference_interval_2_cm?: number | null;
    circumference_interval_3_cm?: number | null;
    circumference_interval_4_cm?: number | null;
    circumference_interval_5_cm?: number | null;
    circumference_interval_6_cm?: number | null;
    circumference_distal_end_cm?: number | null;
    limb_shape_drawing?: string | null;
    footwear_type?: string | null;
    heel_height_cm?: number | null;
    socket_ap_width_cm?: number | null;
    socket_ml_width_cm?: number | null;
    rom_flexion_deg?: number | null;
    rom_extension_deg?: number | null;
    rom_abduction_deg?: number | null;
    rom_adduction_deg?: number | null;
    partial_foot_level?: string | null;
    foot_length_cm?: number | null;
    foot_width_cm?: number | null;
    afo_ankle_joint_type?: string | null;
    afo_ankle_joint_other?: string | null;
    afo_functions?: string[] | null;
    shoe_modification?: string | null;
    segment_length_proximal_cm?: number | null;
    segment_length_distal_cm?: number | null;
    segment_length_terminal_cm?: number | null;
    limb_ap_width_cm?: number | null;
    limb_ml_width_cm?: number | null;
    trunk_circumference_1_cm?: number | null;
    trunk_circumference_2_cm?: number | null;
    trunk_circumference_3_cm?: number | null;
    trunk_circumference_4_cm?: number | null;
    k_level?: string | null;
    lifestyle_goals?: string | null;
    field_notes?: string | null;
    clinician_name?: string | null;
    clinician_signature?: string | null;
  };

  if (!body.consultation_id || !body.patient_id) {
    return NextResponse.json({ error: 'consultation_id and patient_id are required.' }, { status: 400 });
  }

  const consultation = db.prepare('SELECT id FROM consultations WHERE id = ? AND patient_id = ?').get(body.consultation_id, body.patient_id);
  if (!consultation) return NextResponse.json({ error: 'Consultation not found for this patient.' }, { status: 404 });

  const doctorId = practitioner.role === 'doctor' ? practitioner.id : null;
  const poSpecialistId = practitioner.role === 'po_specialist' ? practitioner.id : null;

  const result = db.prepare(`
    INSERT INTO prosthetic_measurements (
      consultation_id, patient_id, doctor_id, po_specialist_id, conducted_by_role,
      amputation_date, cause_of_limb_loss, cause_other_detail,
      limb_shape_profile, residual_limb_length_cm, sound_limb_length_cm,
      circumference_joint_line_cm, circumference_interval_1_cm, circumference_interval_2_cm,
      circumference_interval_3_cm, circumference_interval_4_cm, circumference_interval_5_cm,
      circumference_interval_6_cm, circumference_distal_end_cm, limb_shape_drawing,
      footwear_type, heel_height_cm, socket_ap_width_cm, socket_ml_width_cm,
      rom_flexion_deg, rom_extension_deg, rom_abduction_deg, rom_adduction_deg,
      partial_foot_level, foot_length_cm, foot_width_cm,
      afo_ankle_joint_type, afo_ankle_joint_other, afo_functions, shoe_modification,
      segment_length_proximal_cm, segment_length_distal_cm, segment_length_terminal_cm,
      limb_ap_width_cm, limb_ml_width_cm,
      trunk_circumference_1_cm, trunk_circumference_2_cm, trunk_circumference_3_cm, trunk_circumference_4_cm,
      k_level, lifestyle_goals, field_notes, clinician_name, clinician_signature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.consultation_id,
    body.patient_id,
    doctorId,
    poSpecialistId,
    practitioner.role,
    body.amputation_date || null,
    body.cause_of_limb_loss || null,
    body.cause_of_limb_loss === 'other' ? (body.cause_other_detail?.trim() || null) : null,
    body.limb_shape_profile || null,
    body.residual_limb_length_cm ?? null,
    body.sound_limb_length_cm ?? null,
    body.circumference_joint_line_cm ?? null,
    body.circumference_interval_1_cm ?? null,
    body.circumference_interval_2_cm ?? null,
    body.circumference_interval_3_cm ?? null,
    body.circumference_interval_4_cm ?? null,
    body.circumference_interval_5_cm ?? null,
    body.circumference_interval_6_cm ?? null,
    body.circumference_distal_end_cm ?? null,
    body.limb_shape_drawing || null,
    body.footwear_type || null,
    body.heel_height_cm ?? null,
    body.socket_ap_width_cm ?? null,
    body.socket_ml_width_cm ?? null,
    body.rom_flexion_deg ?? null,
    body.rom_extension_deg ?? null,
    body.rom_abduction_deg ?? null,
    body.rom_adduction_deg ?? null,
    body.partial_foot_level || null,
    body.foot_length_cm ?? null,
    body.foot_width_cm ?? null,
    body.afo_ankle_joint_type || null,
    body.afo_ankle_joint_other?.trim() || null,
    body.afo_functions?.length ? body.afo_functions.join(', ') : null,
    body.shoe_modification?.trim() || null,
    body.segment_length_proximal_cm ?? null,
    body.segment_length_distal_cm ?? null,
    body.segment_length_terminal_cm ?? null,
    body.limb_ap_width_cm ?? null,
    body.limb_ml_width_cm ?? null,
    body.trunk_circumference_1_cm ?? null,
    body.trunk_circumference_2_cm ?? null,
    body.trunk_circumference_3_cm ?? null,
    body.trunk_circumference_4_cm ?? null,
    body.k_level || null,
    body.lifestyle_goals?.trim() || null,
    body.field_notes?.trim() || null,
    body.clinician_name?.trim() || null,
    body.clinician_signature || null,
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
}
