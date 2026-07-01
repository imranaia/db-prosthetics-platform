import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM site_content').all() as { key: string; value: string }[];
  const content: Record<string, string> = {};
  for (const row of rows) content[row.key] = row.value;
  return NextResponse.json(content);
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates: Record<string, string> = await req.json();
  const db = getDb();

  const upsert = db.prepare(`
    INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);

  const tx = db.transaction((data: Record<string, string>) => {
    for (const [k, v] of Object.entries(data)) upsert.run(k, v);
  });
  tx(updates);

  return NextResponse.json({ success: true });
}
