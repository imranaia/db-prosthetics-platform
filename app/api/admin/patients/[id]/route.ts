import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as {
    full_name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    state?: string;
    lga?: string;
    address?: string;
  };

  const db = getDb();
  const patient = db.prepare('SELECT user_id FROM patients WHERE id = ?').get(id) as { user_id: number } | undefined;
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  if (body.email !== undefined) {
    const newEmail = body.email.trim().toLowerCase();
    if (!newEmail) return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 });
    const clash = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, patient.user_id);
    if (clash) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, patient.user_id);
  }

  const setClauses: string[] = [];
  const values: (string | null)[] = [];
  if (body.full_name !== undefined) { setClauses.push('full_name = ?'); values.push(body.full_name.trim()); }
  if (body.phone !== undefined)     { setClauses.push('phone = ?');     values.push(body.phone || null); }
  if (body.dob !== undefined)       { setClauses.push('dob = ?');       values.push(body.dob || null); }
  if (body.state !== undefined)     { setClauses.push('state = ?');     values.push(body.state || null); }
  if (body.lga !== undefined)       { setClauses.push('lga = ?');       values.push(body.lga || null); }
  if (body.address !== undefined)   { setClauses.push('address = ?');   values.push(body.address || null); }

  if (setClauses.length > 0) {
    values.push(id);
    db.prepare(`UPDATE patients SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  return NextResponse.json({ success: true });
}
