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
    quoted_price?: number;
    assigned_hospital_id?: number;
    status?: string;
  };

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number)[] = [];

  if (body.quoted_price !== undefined)       { setClauses.push('quoted_price = ?');       values.push(Math.round(body.quoted_price * 100)); }
  if (body.assigned_hospital_id !== undefined) { setClauses.push('assigned_hospital_id = ?'); values.push(body.assigned_hospital_id); }
  if (body.status !== undefined)             { setClauses.push('status = ?');             values.push(body.status); }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE appointments SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  return NextResponse.json({ success: true });
}
