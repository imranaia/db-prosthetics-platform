import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  return NextResponse.json(db.prepare('SELECT * FROM materials ORDER BY name ASC').all());
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, description, in_stock } = await req.json() as { name: string; description?: string; in_stock?: number };
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const db = getDb();
  const result = db.prepare('INSERT INTO materials (name, description, in_stock) VALUES (?, ?, ?)').run(name.trim(), description || null, in_stock ?? 1);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, name, description, in_stock } = await req.json() as { id: number; name?: string; description?: string; in_stock?: number };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const db = getDb();
  const sets: string[] = []; const vals: (string | number | null)[] = [];
  if (name !== undefined)        { sets.push('name = ?');        vals.push(name); }
  if (description !== undefined) { sets.push('description = ?'); vals.push(description || null); }
  if (in_stock !== undefined)    { sets.push('in_stock = ?');    vals.push(in_stock); }
  if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  vals.push(id);
  db.prepare(`UPDATE materials SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json() as { id: number };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const db = getDb();
  db.prepare('DELETE FROM materials WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
