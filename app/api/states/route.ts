import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

/** Returns distinct Nigerian states where DB Prosthetics has registered hospitals. */
export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT DISTINCT state
         FROM hospitals
         ORDER BY state ASC`
      )
      .all() as { state: string }[];

    return NextResponse.json({ states: rows.map((r) => r.state) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch states' }, { status: 500 });
  }
}
