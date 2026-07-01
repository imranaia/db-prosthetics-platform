import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const members = db
    .prepare(`SELECT id, name, position, photo_url, bio, display_order FROM team_members ORDER BY display_order ASC, id ASC`)
    .all();
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const { name, position, bio, photo_url, display_order } = await req.json();
  if (!name || !position) {
    return NextResponse.json({ error: 'name and position required' }, { status: 400 });
  }
  const db = getDb();
  const result = db
    .prepare(`INSERT INTO team_members (name, position, bio, photo_url, display_order) VALUES (?, ?, ?, ?, ?)`)
    .run(name.trim(), position.trim(), bio?.trim() || null, photo_url || null, display_order ?? 0);
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PATCH(req: NextRequest) {
  const { id, name, position, bio, photo_url, display_order } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const db = getDb();
  db.prepare(`UPDATE team_members SET name=?, position=?, bio=?, photo_url=?, display_order=? WHERE id=?`)
    .run(name?.trim(), position?.trim(), bio?.trim() || null, photo_url || null, display_order ?? 0, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const db = getDb();
  db.prepare(`DELETE FROM team_members WHERE id=?`).run(id);
  return NextResponse.json({ ok: true });
}
