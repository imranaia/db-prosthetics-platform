import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

function getHospitalId(db: ReturnType<typeof getDb>, userId: number, role: string): number | undefined {
  if (role === 'hospital_admin') {
    const row = db.prepare('SELECT id FROM hospitals WHERE admin_user_id = ?').get(userId) as { id: number } | undefined;
    return row?.id;
  }
  if (role === 'doctor') {
    const row = db.prepare('SELECT hospital_id FROM doctors WHERE user_id = ?').get(userId) as { hospital_id: number | null } | undefined;
    return row?.hospital_id ?? undefined;
  }
  if (role === 'po_specialist') {
    const row = db.prepare('SELECT hospital_id FROM po_specialists WHERE user_id = ?').get(userId) as { hospital_id: number | null } | undefined;
    return row?.hospital_id ?? undefined;
  }
  if (role === 'receptionist') {
    const row = db.prepare('SELECT hospital_id FROM receptionists WHERE user_id = ?').get(userId) as { hospital_id: number } | undefined;
    return row?.hospital_id;
  }
  return undefined;
}

const ALLOWED_ROLES = ['doctor', 'po_specialist', 'receptionist', 'hospital_admin'];

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const hospitalId = getHospitalId(db, user.id, user.role);
  if (!hospitalId) {
    // Independent (non-hospital-affiliated) doctors have no hospital queue.
    return NextResponse.json({ queue: [], hospital_id: null });
  }

  const rows = db.prepare(`
    SELECT a.id, a.patient_id, a.scheduled_date, a.preferred_date, a.notes,
           a.patient_checked_in, a.queue_skipped, a.queue_skip_reason, a.with_doctor,
           p.full_name AS patient_name, p.patient_unique_id, p.phone AS patient_phone
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.assigned_hospital_id = ?
      AND a.type = 'hospital'
      AND a.status = 'confirmed'
      AND date(COALESCE(a.scheduled_date, a.preferred_date)) = date('now')
    ORDER BY COALESCE(a.scheduled_date, a.preferred_date) ASC, a.created_at ASC
  `).all(hospitalId) as Array<{
    id: number; patient_id: number; scheduled_date: string | null; preferred_date: string | null; notes: string | null;
    patient_checked_in: number; queue_skipped: number; queue_skip_reason: string | null; with_doctor: number;
    patient_name: string; patient_unique_id: string | null; patient_phone: string | null;
  }>;

  // The queue order never changes — a skipped patient just stops being
  // "current" until checked in again, at which point they're re-evaluated
  // in their original position, not moved to the back.
  const currentIndex = rows.findIndex(r => !r.queue_skipped);
  const queue = rows.map((r, i) => ({ ...r, is_current: i === currentIndex }));

  return NextResponse.json({ queue, hospital_id: hospitalId });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const hospitalId = getHospitalId(db, user.id, user.role);
  if (!hospitalId) return NextResponse.json({ error: 'No hospital found for this account.' }, { status: 404 });

  const { appointment_id, action, reason } = await req.json() as { appointment_id: number; action: string; reason?: string };
  if (!appointment_id || !action) return NextResponse.json({ error: 'appointment_id and action are required.' }, { status: 400 });

  const appointment = db.prepare('SELECT id, payment_status FROM appointments WHERE id = ? AND assigned_hospital_id = ?')
    .get(appointment_id, hospitalId) as { id: number; payment_status: string } | undefined;
  if (!appointment) return NextResponse.json({ error: 'Appointment not found at this hospital.' }, { status: 404 });

  if (action === 'check_in') {
    // Receptionist/hospital admin: patient has physically arrived — this
    // also clears any earlier skip, since they're now available to be seen.
    if (user.role !== 'receptionist' && user.role !== 'hospital_admin') {
      return NextResponse.json({ error: 'Only reception can check a patient in.' }, { status: 403 });
    }
    db.prepare('UPDATE appointments SET patient_checked_in = 1, queue_skipped = 0, queue_skip_reason = NULL WHERE id = ?').run(appointment_id);
  } else if (action === 'skip') {
    // Doctor/P&O specialist/hospital admin: patient isn't available right
    // now — keep their place in line, just don't block on them.
    if (user.role !== 'doctor' && user.role !== 'po_specialist' && user.role !== 'hospital_admin') {
      return NextResponse.json({ error: 'Only the practitioner can skip the current patient.' }, { status: 403 });
    }
    if (!reason?.trim()) return NextResponse.json({ error: 'A reason is required to skip a patient.' }, { status: 400 });
    db.prepare('UPDATE appointments SET queue_skipped = 1, queue_skip_reason = ? WHERE id = ?').run(reason.trim(), appointment_id);
  } else if (action === 'start') {
    // Doctor/P&O specialist/hospital admin: the practitioner has actually
    // called this patient in and is seeing them now — distinct from
    // "completed" so the button has somewhere to go before the visit is
    // fully done, and patients/reception can see "with the doctor" live.
    if (user.role !== 'doctor' && user.role !== 'po_specialist' && user.role !== 'hospital_admin') {
      return NextResponse.json({ error: 'Only the practitioner can start seeing this patient.' }, { status: 403 });
    }
    db.prepare('UPDATE appointments SET with_doctor = 1 WHERE id = ?').run(appointment_id);
  } else if (action === 'complete') {
    if (user.role !== 'doctor' && user.role !== 'po_specialist' && user.role !== 'hospital_admin') {
      return NextResponse.json({ error: 'Only the practitioner can complete this appointment.' }, { status: 403 });
    }
    // Same rule as the super-admin completion path — a hospital visit can't
    // be closed out with an outstanding bill.
    if (appointment.payment_status === 'unpaid') {
      return NextResponse.json({ error: 'This appointment has an unpaid bill. It must be paid before it can be marked complete.' }, { status: 400 });
    }
    db.prepare("UPDATE appointments SET status = 'completed', with_doctor = 0 WHERE id = ?").run(appointment_id);
  } else {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
