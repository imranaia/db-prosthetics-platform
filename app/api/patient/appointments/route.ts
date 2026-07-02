import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;

  if (!patient) {
    return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
  }

  const appointments = db
    .prepare(
      `SELECT a.*, h.name AS hospital_name
       FROM appointments a
       LEFT JOIN hospitals h ON a.assigned_hospital_id = h.id
       WHERE a.patient_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(patient.id);

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;

  if (!patient) {
    return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
  }

  const { type, notes, preferred_date } = await req.json();

  if (!type || (type !== 'home' && type !== 'hospital')) {
    return NextResponse.json({ error: 'type must be "home" or "hospital".' }, { status: 400 });
  }

  db.prepare(
    `INSERT INTO appointments (patient_id, type, notes, preferred_date, status)
     VALUES (?, ?, ?, ?, 'requested')`
  ).run(patient.id, type, notes || null, preferred_date || null);

  return NextResponse.json({ success: true }, { status: 201 });
}
