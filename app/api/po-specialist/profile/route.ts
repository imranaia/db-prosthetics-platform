import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'po_specialist') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const profile = db.prepare(`
    SELECT ps.*, u.email
    FROM po_specialists ps
    JOIN users u ON ps.user_id = u.id
    WHERE ps.user_id = ?
  `).get(user.id);

  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'po_specialist') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, string | number | null>;

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  const fields = ['full_name','phone','specialization','years_experience','qualifications','state','lga','address','dob','gender','marital_status','occupation','religion','next_of_kin_name','next_of_kin_relationship','next_of_kin_phone'];
  for (const f of fields) {
    if (body[f] !== undefined) { setClauses.push(`${f} = ?`); values.push(body[f]); }
  }
  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(user.id);
  db.prepare(`UPDATE po_specialists SET ${setClauses.join(', ')} WHERE user_id = ?`).run(...values);
  return NextResponse.json({ success: true });
}
