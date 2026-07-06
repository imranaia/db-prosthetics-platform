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
  const appointments = db.prepare(`
    SELECT a.*, p.full_name AS patient_name, p.phone AS patient_phone,
           p.state AS patient_state, p.lga AS patient_lga, p.address AS patient_address,
           rd.full_name AS requested_doctor_name,
           ad.full_name AS assigned_doctor_name,
           rp.full_name AS requested_po_specialist_name,
           ap.full_name AS assigned_po_specialist_name
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors rd ON a.requested_doctor_id = rd.id
    LEFT JOIN doctors ad ON a.assigned_doctor_id = ad.id
    LEFT JOIN po_specialists rp ON a.requested_po_specialist_id = rp.id
    LEFT JOIN po_specialists ap ON a.assigned_po_specialist_id = ap.id
    ORDER BY a.created_at DESC
  `).all();

  return NextResponse.json(appointments);
}
