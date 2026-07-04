import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const row = db.prepare('SELECT id, email, full_name, phone, dob, gender, address, state, lga, marital_status, occupation, religion, next_of_kin_name, next_of_kin_relationship, next_of_kin_phone, profile_completed_at FROM users WHERE id = ?').get(user.id);
  return NextResponse.json({ profile: row });
}

const REQUIRED_PROFILE_FIELDS = ['full_name', 'phone', 'state', 'lga', 'address'] as const;

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    full_name?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    address?: string;
    state?: string;
    lga?: string;
    marital_status?: string;
    occupation?: string;
    religion?: string;
    next_of_kin_name?: string;
    next_of_kin_relationship?: string;
    next_of_kin_phone?: string;
  };

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | null)[] = [];
  const fields = ['full_name','phone','dob','gender','address','state','lga','marital_status','occupation','religion','next_of_kin_name','next_of_kin_relationship','next_of_kin_phone'] as const;
  for (const f of fields) {
    if (body[f] !== undefined) { setClauses.push(`${f} = ?`); values.push(body[f] ?? null); }
  }
  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(user.id as unknown as string);
  db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  // Mirrors the patient onboarding gate for staff accounts: once the core
  // profile fields are all filled in, mark the profile complete so the
  // dashboard-wide gate stops redirecting here.
  const updated = db.prepare('SELECT full_name, phone, state, lga, address, profile_completed_at FROM users WHERE id = ?').get(user.id) as Record<string, string | null>;
  const isComplete = REQUIRED_PROFILE_FIELDS.every(f => !!updated[f]);
  if (isComplete && !updated.profile_completed_at) {
    db.prepare(`UPDATE users SET profile_completed_at = datetime('now') WHERE id = ?`).run(user.id);
  }

  return NextResponse.json({ success: true });
}
