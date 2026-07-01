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
    in_stock: number;
  };

  const { name, category, type, price, description, in_stock } = body;

  if (!name || !category || !type || price == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO products (name, category, type, price, description, in_stock) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, category, type, Math.round(price * 100), description || '', in_stock ?? 1);

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
