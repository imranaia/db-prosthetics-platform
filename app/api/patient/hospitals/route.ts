import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

// Hospital directory for a patient booking a hospital-visit appointment,
// ranked by proximity to the patient's own state/LGA (from their profile) —
// same LGA first, then same state, then everywhere else. There's no lat/lng
// data on hospitals yet, so this is the practical proxy for "closest" across
// Nigeria's state/LGA structure rather than true geo-distance.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const patient = db.prepare('SELECT state, lga FROM patients WHERE user_id = ?').get(user.id) as
    { state: string | null; lga: string | null } | undefined;

  const hospitals = db.prepare(`
    SELECT id, name, state, lga, landmark, address
    FROM hospitals
    ORDER BY name ASC
  `).all() as { id: number; name: string; state: string | null; lga: string | null; landmark: string | null; address: string | null }[];

  const withRank = hospitals.map(h => {
    const sameLga = !!(patient?.lga && h.lga && h.lga === patient.lga);
    const sameState = !!(patient?.state && h.state && h.state === patient.state);
    const proximityRank = sameLga ? 0 : sameState ? 1 : 2;
    return { ...h, proximity_rank: proximityRank };
  });

  withRank.sort((a, b) => a.proximity_rank - b.proximity_rank || a.name.localeCompare(b.name));

  return NextResponse.json(withRank);
}
