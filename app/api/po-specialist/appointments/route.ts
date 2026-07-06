import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'po_specialist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const specialist = db
    .prepare('SELECT id, hospital_id FROM po_specialists WHERE user_id = ?')
    .get(user.id) as { id: number; hospital_id: number } | undefined;

  if (!specialist) {
    return NextResponse.json({ error: 'Specialist record not found' }, { status: 404 });
  }

  const appointments = db
    .prepare(
      `SELECT a.*, p.full_name AS patient_name, p.phone AS patient_phone
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.assigned_po_specialist_id = ?
          OR (a.type = 'hospital' AND a.assigned_hospital_id = ?)
       ORDER BY a.created_at DESC`
    )
    .all(specialist.id, specialist.hospital_id);

  return NextResponse.json({ appointments, specialistId: specialist.id });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'po_specialist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const specialist = db
    .prepare('SELECT id, hospital_id FROM po_specialists WHERE user_id = ?')
    .get(user.id) as { id: number; hospital_id: number } | undefined;

  if (!specialist) {
    return NextResponse.json({ error: 'Specialist record not found' }, { status: 404 });
  }

  const body = await req.json() as {
    id: number;
    status?: string;
    scheduled_date?: string | null;
    notes?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: 'Appointment id is required' }, { status: 400 });
  }

  // Verify the appointment is assigned to this specialist directly (home
  // visit) or belongs to their hospital (hospital visit).
  const appt = db
    .prepare('SELECT id FROM appointments WHERE id = ? AND (assigned_po_specialist_id = ? OR (type = \'hospital\' AND assigned_hospital_id = ?))')
    .get(body.id, specialist.id, specialist.hospital_id) as { id: number } | undefined;

  if (!appt) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
  if (body.scheduled_date !== undefined) { updates.push('scheduled_date = ?'); values.push(body.scheduled_date); }
  if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes); }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(body.id);
  db.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return NextResponse.json({ success: true });
}
