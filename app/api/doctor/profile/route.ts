import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'doctor') {
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
  if (!user || user.role !== 'doctor') {
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
  };

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.full_name !== undefined)       { setClauses.push('full_name = ?');       values.push(body.full_name); }
  if (body.phone !== undefined)           { setClauses.push('phone = ?');           values.push(body.phone); }
  if (body.specialization !== undefined)  { setClauses.push('specialization = ?');  values.push(body.specialization); }
  if (body.state !== undefined)           { setClauses.push('state = ?');           values.push(body.state); }
  if (body.lga !== undefined)             { setClauses.push('lga = ?');             values.push(body.lga); }
  if (body.address !== undefined)         { setClauses.push('address = ?');         values.push(body.address); }
  if (body.years_experience !== undefined){ setClauses.push('years_experience = ?'); values.push(body.years_experience); }
  if (body.qualifications !== undefined)  { setClauses.push('qualifications = ?');  values.push(body.qualifications); }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(user.id);
  db.prepare(`UPDATE doctors SET ${setClauses.join(', ')} WHERE user_id = ?`).run(...values);

  return NextResponse.json({ success: true });
}
