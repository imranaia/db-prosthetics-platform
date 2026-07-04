import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || (user.role !== 'doctor' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const doctor = db.prepare(`
    SELECT d.*, u.email
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.user_id = ?
  `).get(user.id);

  if (!doctor) {
    return NextResponse.json({ error: 'Doctor record not found' }, { status: 404 });
  }

  return NextResponse.json({ doctor });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || (user.role !== 'doctor' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    full_name?: string;
    phone?: string;
    specialization?: string;
    state?: string;
    lga?: string;
    address?: string;
    years_experience?: number;
    qualifications?: string;
    dob?: string;
    gender?: string;
    marital_status?: string;
    occupation?: string;
    religion?: string;
    next_of_kin_name?: string;
    next_of_kin_relationship?: string;
    next_of_kin_phone?: string;
  };

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.full_name !== undefined)             { setClauses.push('full_name = ?');             values.push(body.full_name); }
  if (body.phone !== undefined)                 { setClauses.push('phone = ?');                 values.push(body.phone); }
  if (body.specialization !== undefined)        { setClauses.push('specialization = ?');        values.push(body.specialization); }
  if (body.state !== undefined)                 { setClauses.push('state = ?');                 values.push(body.state); }
  if (body.lga !== undefined)                   { setClauses.push('lga = ?');                   values.push(body.lga); }
  if (body.address !== undefined)               { setClauses.push('address = ?');               values.push(body.address); }
  if (body.years_experience !== undefined)      { setClauses.push('years_experience = ?');      values.push(body.years_experience); }
  if (body.qualifications !== undefined)        { setClauses.push('qualifications = ?');        values.push(body.qualifications); }
  if (body.dob !== undefined)                   { setClauses.push('dob = ?');                   values.push(body.dob); }
  if (body.gender !== undefined)                { setClauses.push('gender = ?');                values.push(body.gender); }
  if (body.marital_status !== undefined)        { setClauses.push('marital_status = ?');        values.push(body.marital_status); }
  if (body.occupation !== undefined)            { setClauses.push('occupation = ?');            values.push(body.occupation); }
  if (body.religion !== undefined)              { setClauses.push('religion = ?');              values.push(body.religion); }
  if (body.next_of_kin_name !== undefined)      { setClauses.push('next_of_kin_name = ?');      values.push(body.next_of_kin_name); }
  if (body.next_of_kin_relationship !== undefined) { setClauses.push('next_of_kin_relationship = ?'); values.push(body.next_of_kin_relationship); }
  if (body.next_of_kin_phone !== undefined)     { setClauses.push('next_of_kin_phone = ?');     values.push(body.next_of_kin_phone); }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(user.id);
  db.prepare(`UPDATE doctors SET ${setClauses.join(', ')} WHERE user_id = ?`).run(...values);

  // Mirrors the patient onboarding gate for staff accounts created with a
  // temp password: once core profile fields are filled in, mark complete.
  const updated = db.prepare('SELECT full_name, phone, state, lga, address, profile_completed_at FROM doctors WHERE user_id = ?').get(user.id) as Record<string, string | null>;
  const isComplete = ['full_name', 'phone', 'state', 'lga', 'address'].every(f => !!updated[f]);
  if (isComplete && !updated.profile_completed_at) {
    db.prepare(`UPDATE doctors SET profile_completed_at = datetime('now') WHERE user_id = ?`).run(user.id);
  }

  return NextResponse.json({ success: true });
}
