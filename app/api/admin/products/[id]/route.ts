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
    category?: string;
    type?: string;
    price?: number;
    cost_price?: number | null;
    description?: string;
    image_url?: string | null;
    dimensions?: string;
    material?: string;
    quantity?: number;
  };

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.name !== undefined)        { setClauses.push('name = ?');        values.push(body.name); }
  if (body.category !== undefined)    { setClauses.push('category = ?');    values.push(body.category); }
  if (body.type !== undefined)        { setClauses.push('type = ?');        values.push(body.type); }
  if (body.price !== undefined)       { setClauses.push('price = ?');       values.push(Math.round(body.price * 100)); }
  if (body.cost_price !== undefined)  { setClauses.push('cost_price = ?');  values.push(body.cost_price != null ? Math.round(body.cost_price * 100) : null); }
  if (body.description !== undefined) { setClauses.push('description = ?'); values.push(body.description); }
  if (body.image_url !== undefined)   { setClauses.push('image_url = ?');   values.push(body.image_url); }
  if (body.dimensions !== undefined)  { setClauses.push('dimensions = ?');  values.push(body.dimensions); }
  if (body.material !== undefined)    { setClauses.push('material = ?');    values.push(body.material); }
  // in_stock is derived from quantity, not set independently, so the two
  // can never show contradicting stock status on the product card.
  if (body.quantity !== undefined) {
    setClauses.push('quantity = ?');  values.push(body.quantity);
    setClauses.push('in_stock = ?');  values.push(body.quantity > 0 ? 1 : 0);
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

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
  db.prepare('DELETE FROM products WHERE id = ?').run(id);

  return NextResponse.json({ success: true });
}
