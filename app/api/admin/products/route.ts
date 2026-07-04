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
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    name: string;
    category: string;
    type: string;
    price: number;
    description: string;
    image_url?: string;
    dimensions?: string;
    material?: string;
    quantity?: number;
  };

  const { name, category, type, price, description, image_url, dimensions, material, quantity } = body;

  if (!name || !category || !type || price == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // in_stock is derived from quantity, not set independently, so the two
  // can never show contradicting stock status on the product card.
  const qty = quantity ?? 0;
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO products (name, category, type, price, description, in_stock, image_url, dimensions, material, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, category, type, Math.round(price * 100), description || '', qty > 0 ? 1 : 0, image_url || null, dimensions || null, material || null, qty);

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
