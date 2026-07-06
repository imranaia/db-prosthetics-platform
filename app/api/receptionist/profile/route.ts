import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'receptionist') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const profile = db.prepare(`
    SELECT r.*, u.email
    FROM receptionists r
    JOIN users u ON r.user_id = u.id
    WHERE r.user_id = ?
  `).get(user.id);

  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'receptionist') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, string | number | null>;

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  const fields = ['full_name', 'phone', 'state', 'lga', 'address', 'dob', 'gender', 'marital_status', 'occupation', 'religion', 'next_of_kin_name', 'next_of_kin_relationship', 'next_of_kin_phone'];
  for (const f of fields) {
    if (body[f] !== undefined) { setClauses.push(`${f} = ?`); values.push(body[f]); }
  }
  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(user.id);
  db.prepare(`UPDATE receptionists SET ${setClauses.join(', ')} WHERE user_id = ?`).run(...values);

  // Mirrors the doctor/P&O staff profile-completion gate.
  const updated = db.prepare('SELECT full_name, phone, state, lga, address, profile_completed_at FROM receptionists WHERE user_id = ?').get(user.id) as Record<string, string | null>;
  const isComplete = ['full_name', 'phone', 'state', 'lga', 'address'].every(f => !!updated[f]);
  if (isComplete && !updated.profile_completed_at) {
    db.prepare(`UPDATE receptionists SET profile_completed_at = datetime('now') WHERE user_id = ?`).run(user.id);
  }

  return NextResponse.json({ success: true });
}
