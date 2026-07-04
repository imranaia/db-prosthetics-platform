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
    name?: string;
    state?: string;
    lga?: string;
    landmark?: string;
    address?: string;
    admin_email?: string;
  };

  const db = getDb();
  const hospital = db.prepare('SELECT admin_user_id FROM hospitals WHERE id = ?').get(id) as { admin_user_id: number | null } | undefined;
  if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

  if (body.admin_email !== undefined) {
    const newEmail = body.admin_email.trim().toLowerCase();
    if (!newEmail) return NextResponse.json({ error: 'Admin email cannot be empty' }, { status: 400 });
    const clash = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, hospital.admin_user_id ?? -1);
    if (clash) return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    if (hospital.admin_user_id) {
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, hospital.admin_user_id);
    }
  }

  const setClauses: string[] = [];
  const values: (string | null)[] = [];
  if (body.name !== undefined)     { setClauses.push('name = ?');     values.push(body.name.trim()); }
  if (body.state !== undefined)    { setClauses.push('state = ?');    values.push(body.state); }
  if (body.lga !== undefined)      { setClauses.push('lga = ?');      values.push(body.lga || null); }
  if (body.landmark !== undefined) { setClauses.push('landmark = ?'); values.push(body.landmark || null); }
  if (body.address !== undefined)  { setClauses.push('address = ?');  values.push(body.address || null); }

  if (setClauses.length > 0) {
    values.push(id);
    db.prepare(`UPDATE hospitals SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  db.prepare('DELETE FROM hospitals WHERE id = ?').run(id);

  return NextResponse.json({ success: true });
}
