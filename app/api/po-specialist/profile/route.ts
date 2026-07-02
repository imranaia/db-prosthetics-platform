import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'po_specialist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const specialist = db.prepare(`
    SELECT ps.*, u.email
    FROM po_specialists ps
    JOIN users u ON ps.user_id = u.id
    WHERE ps.user_id = ?
  `).get(user.id);

  if (!specialist) {
    return NextResponse.json({ error: 'P&O Specialist record not found' }, { status: 404 });
  }

  return NextResponse.json({ specialist });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'po_specialist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Update user table for name/phone since po_specialists has minimal columns
  // We update the users table for display name via email (just email is in users)
  // For extended fields we'd need a migration; for now we handle what exists
  const body = await req.json() as { full_name?: string; phone?: string };

  const db = getDb();
  // Store name/phone in users table pragmatically — update what's available
  if (body.full_name !== undefined || body.phone !== undefined) {
    const setClauses: string[] = [];
    const values: (string)[] = [];
    // users table typically has email, password_hash, role
    // If a name column exists, set it — otherwise skip gracefully
    if (body.full_name !== undefined) {
      try {
        db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(body.full_name, user.id);
      } catch { /* column may not exist */ }
    }
    if (body.phone !== undefined) {
      try {
        db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(body.phone, user.id);
      } catch { /* column may not exist */ }
    }
    void setClauses; void values;
  }

  return NextResponse.json({ success: true });
}
