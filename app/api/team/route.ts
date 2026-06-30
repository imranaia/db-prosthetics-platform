import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const members = db
      .prepare(
        `SELECT id, name, position, photo_url, bio, display_order
         FROM team_members
         ORDER BY display_order ASC, id ASC`
      )
      .all();

    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}
