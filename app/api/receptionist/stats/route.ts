import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

async function getHospital(userId: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT h.id, h.name FROM receptionists r
       JOIN hospitals h ON r.hospital_id = h.id
       WHERE r.user_id = ?`
    )
    .get(userId) as { id: number; name: string } | undefined;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'receptionist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

  const db = getDb();

  const doctors = db
    .prepare(`SELECT COUNT(*) as n FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.hospital_id = ? AND u.role = 'doctor'`)
    .get(hospital.id) as { n: number };

  const patientsRegistered = db
    .prepare(`SELECT COUNT(*) as n FROM patients WHERE registering_hospital_id = ?`)
    .get(hospital.id) as { n: number };

  const todayAppointments = db
    .prepare(
      `SELECT COUNT(*) as n FROM appointments
       WHERE assigned_hospital_id = ? AND status NOT IN ('cancelled', 'completed')
         AND date(scheduled_date) = date('now')`
    )
    .get(hospital.id) as { n: number };

  const upcomingAppointments = db
    .prepare(
      `SELECT COUNT(*) as n FROM appointments
       WHERE assigned_hospital_id = ? AND status NOT IN ('cancelled', 'completed')
         AND scheduled_date >= datetime('now')`
    )
    .get(hospital.id) as { n: number };

  return NextResponse.json({
    hospital_name: hospital.name,
    doctors: doctors.n,
    patients_registered: patientsRegistered.n,
    today_appointments: todayAppointments.n,
    upcoming_appointments: upcomingAppointments.n,
  });
}
