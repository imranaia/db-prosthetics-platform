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
    SELECT cf.*, p.full_name AS patient_name, h.name AS hospital_name
    FROM consent_forms cf
    LEFT JOIN patients p ON cf.patient_id = p.id
    LEFT JOIN hospitals h ON cf.hospital_id = h.id
    ORDER BY cf.created_at DESC
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
    patient_display_id?: string;
    form_date?: string;
    patient_guardian_name?: string;
    patient_guardian_signature?: string | null;
    witness_name?: string;
    witness_signature?: string | null;
    clinician_name?: string;
    clinician_signature?: string | null;
  };

  if (!body.patient_id) return NextResponse.json({ error: 'patient_id is required' }, { status: 400 });
  if (!body.patient_guardian_signature) return NextResponse.json({ error: 'Patient / Guardian signature is required' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO consent_forms (
      patient_id, consultation_id, hospital_id, patient_display_id, form_date,
      patient_guardian_name, patient_guardian_signature,
      witness_name, witness_signature,
      clinician_name, clinician_signature, conducted_by_role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'super_admin')
  `).run(
    body.patient_id,
    body.consultation_id ?? null,
    body.hospital_id ?? null,
    body.patient_display_id ?? null,
    body.form_date || new Date().toISOString().slice(0, 10),
    body.patient_guardian_name ?? null,
    body.patient_guardian_signature ?? null,
    body.witness_name ?? null,
    body.witness_signature ?? null,
    body.clinician_name ?? null,
    body.clinician_signature ?? null,
  );

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
