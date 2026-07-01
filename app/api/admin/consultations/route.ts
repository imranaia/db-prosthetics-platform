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
      c.id, c.notes, c.conducted_by_role, c.created_at,
      p.full_name AS patient_name,
      u.email    AS doctor_email
    FROM consultations c
    LEFT JOIN patients p ON c.patient_id = p.id
    LEFT JOIN doctors d  ON c.doctor_id = d.id
    LEFT JOIN users u    ON d.user_id = u.id
    ORDER BY c.created_at DESC
  `).all();

  return NextResponse.json(consultations);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { patient_id, notes } = await req.json();
  if (!patient_id || !notes?.trim()) return NextResponse.json({ error: 'Patient and notes are required.' }, { status: 400 });

  const db = getDb();
  db.prepare(`
    INSERT INTO consultations (patient_id, doctor_id, conducted_by_role, notes)
    VALUES (?, NULL, 'super_admin', ?)
  `).run(patient_id, notes.trim());

  return NextResponse.json({ success: true });
}
