import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

// GET is intentionally public — it backs the "About/Team" section on the
// public marketing site (mirrors /api/team). Writes are super_admin-only.
export async function GET() {
  const db = getDb();
  const members = db
    .prepare(`SELECT id, name, position, photo_url, bio, display_order FROM team_members ORDER BY display_order ASC, id ASC`)
    .all();
  return NextResponse.json({ members });
}

async function requireSuperAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  return user && user.role === 'super_admin';
}

export async function POST(req: NextRequest) {
  if (!(await requireSuperAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  if (!(await requireSuperAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, name, position, bio, photo_url, display_order } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const db = getDb();
  db.prepare(`UPDATE team_members SET name=?, position=?, bio=?, photo_url=?, display_order=? WHERE id=?`)
    .run(name?.trim(), position?.trim(), bio?.trim() || null, photo_url || null, display_order ?? 0, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireSuperAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const db = getDb();
  db.prepare(`DELETE FROM team_members WHERE id=?`).run(id);
  return NextResponse.json({ ok: true });
}
