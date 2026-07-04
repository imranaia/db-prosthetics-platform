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
    status?: string;
    fulfillment_status?: string;
    fulfillment_notes?: string;
  };

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number)[] = [];

  if (body.status !== undefined)              { setClauses.push('status = ?');              values.push(body.status); }
  if (body.fulfillment_status !== undefined)  {
    setClauses.push('fulfillment_status = ?');  values.push(body.fulfillment_status);
    // Keep the coarse order status (used for filtering/patient display) in
    // sync with the fulfillment stage automatically, so there's a single
    // button-driven flow instead of two separately-set status fields.
    if (body.status === undefined) {
      const derivedStatus = ['dispatched', 'delivered', 'received_by_doctor', 'received_by_patient'].includes(body.fulfillment_status)
        ? 'fulfilled'
        : 'processing';
      setClauses.push('status = ?'); values.push(derivedStatus);
    }
  }
  if (body.fulfillment_notes !== undefined)   { setClauses.push('fulfillment_notes = ?');   values.push(body.fulfillment_notes); }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE orders SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  return NextResponse.json({ success: true });
}
