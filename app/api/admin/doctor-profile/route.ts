import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const row = db.prepare(
    `SELECT d.id, d.hospital_id, h.name AS hospital_name
     FROM doctors d LEFT JOIN hospitals h ON d.hospital_id = h.id
     WHERE d.user_id = ?`
  ).get(user.id);

  return NextResponse.json({ doctorProfile: row ?? null });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { hospital_id?: number };
  if (!body.hospital_id) return NextResponse.json({ error: 'hospital_id is required' }, { status: 400 });

  const db = getDb();

  const existing = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id);
  if (existing) return NextResponse.json({ error: 'Doctor profile already enabled' }, { status: 409 });

  const admin = db.prepare('SELECT full_name, phone FROM users WHERE id = ?').get(user.id) as { full_name: string | null; phone: string | null } | undefined;

  const result = db.prepare(
    'INSERT INTO doctors (user_id, hospital_id, full_name, phone) VALUES (?, ?, ?, ?)'
  ).run(user.id, body.hospital_id, admin?.full_name ?? null, admin?.phone ?? null);

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { hospital_id?: number };
  if (!body.hospital_id) return NextResponse.json({ error: 'hospital_id is required' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id);
  if (!existing) return NextResponse.json({ error: 'Doctor profile not enabled' }, { status: 404 });

  db.prepare('UPDATE doctors SET hospital_id = ? WHERE user_id = ?').run(body.hospital_id, user.id);
  return NextResponse.json({ success: true });
}
