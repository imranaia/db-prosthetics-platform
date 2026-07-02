import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'hospital_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  const hospital = db
    .prepare('SELECT id, name, state, lga, address FROM hospitals WHERE admin_user_id = ?')
    .get(user.id) as { id: number; name: string; state: string; lga: string; address: string } | undefined;

  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
  }

  const { id: hospitalId } = hospital;

  const patients = (db
    .prepare(
      'SELECT COUNT(*) as count FROM patients p INNER JOIN consultations c ON p.id = c.patient_id WHERE c.hospital_id = ?'
    )
    .get(hospitalId) as { count: number }).count;

  const consultations = (db
    .prepare('SELECT COUNT(*) as count FROM consultations WHERE hospital_id = ?')
    .get(hospitalId) as { count: number }).count;

  const doctors = (db
    .prepare('SELECT COUNT(*) as count FROM doctors WHERE hospital_id = ?')
    .get(hospitalId) as { count: number }).count;

  const po_specialists = (db
    .prepare('SELECT COUNT(*) as count FROM po_specialists WHERE hospital_id = ?')
    .get(hospitalId) as { count: number }).count;

  const upcoming_appointments = (db
    .prepare(
      "SELECT COUNT(*) as count FROM appointments WHERE assigned_hospital_id = ? AND status NOT IN ('completed','cancelled')"
    )
    .get(hospitalId) as { count: number }).count;

  const this_month_consultations = (db
    .prepare(
      "SELECT COUNT(*) as count FROM consultations WHERE hospital_id = ? AND created_at >= date('now', '-30 days')"
    )
    .get(hospitalId) as { count: number }).count;

  return NextResponse.json({
    hospital,
    stats: {
      patients,
      consultations,
      doctors,
      po_specialists,
      upcoming_appointments,
      this_month_consultations,
    },
  });
}
