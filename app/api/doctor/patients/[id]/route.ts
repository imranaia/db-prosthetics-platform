import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

// Shared by both Doctor and P&O Specialist dashboards, same convention as
// /api/doctor/consultations — one backend route, scoped per practitioner
// table. A practitioner may open a patient's full history (every past
// consultation/order, not just the ones they themselves created) once that
// patient is already in their own "My Patients" list, since continuity of
// care means seeing the whole picture, not just your own past visits.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || (user.role !== 'doctor' && user.role !== 'po_specialist' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const patientId = parseInt(id);
  if (!patientId) return NextResponse.json({ error: 'Invalid patient id' }, { status: 400 });

  const db = getDb();

  const role = user.role === 'super_admin' ? 'doctor' : user.role;
  const table = role === 'doctor' ? 'doctors' : 'po_specialists';
  const practitioner = db.prepare(`SELECT id FROM ${table} WHERE user_id = ?`).get(user.id) as { id: number } | undefined;
  if (!practitioner) return NextResponse.json({ error: 'Practitioner record not found' }, { status: 404 });

  // Same ownership rule already used by each role's "My Patients" list —
  // doctors via a past consultation, P&O specialists via a past order.
  const hasAccess = role === 'doctor'
    ? db.prepare('SELECT 1 FROM consultations WHERE doctor_id = ? AND patient_id = ? LIMIT 1').get(practitioner.id, patientId)
    : db.prepare('SELECT 1 FROM orders WHERE po_specialist_id = ? AND patient_id = ? LIMIT 1').get(practitioner.id, patientId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'This patient is not in your patient list.' }, { status: 403 });
  }

  const patient = db.prepare(
    `SELECT id, full_name, patient_unique_id, phone, dob, state, lga, address, amputation_date, amputation_level, amputation_side
     FROM patients WHERE id = ?`
  ).get(patientId);
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  const consultations = db.prepare(`
    SELECT c.id, c.created_at, c.conducted_by_role, c.assessor_name, c.chief_complaint,
           c.category, c.device_subtype, c.fit_for_prosthetic, c.recommended_device,
           c.consultation_type, h.name AS hospital_name
    FROM consultations c
    LEFT JOIN hospitals h ON c.hospital_id = h.id
    WHERE c.patient_id = ?
    ORDER BY c.created_at DESC
  `).all(patientId);

  const orders = db.prepare(`
    SELECT o.id, o.created_at, o.status, o.fulfillment_status, o.payment_status,
           o.created_by_role, o.total_amount
    FROM orders o
    WHERE o.patient_id = ?
    ORDER BY o.created_at DESC
  `).all(patientId) as Array<{ id: number }>;

  const orderIds = orders.map(o => o.id);
  let itemsByOrder: Record<number, Array<{ product_name: string; quantity: number }>> = {};
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',');
    const items = db.prepare(`
      SELECT oi.order_id, pr.name AS product_name, oi.quantity
      FROM order_items oi
      LEFT JOIN products pr ON oi.product_id = pr.id
      WHERE oi.order_id IN (${placeholders})
    `).all(...orderIds) as Array<{ order_id: number; product_name: string; quantity: number }>;
    for (const item of items) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push({ product_name: item.product_name, quantity: item.quantity });
    }
  }
  const ordersWithItems = orders.map(o => ({ ...o, items: itemsByOrder[o.id] ?? [] }));

  const customOrders = db.prepare(`
    SELECT id, created_at, category, description, status, created_by_role
    FROM custom_orders
    WHERE patient_id = ?
    ORDER BY created_at DESC
  `).all(patientId);

  const dischargeForms = db.prepare(`
    SELECT id, created_at, discharge_date, discharge_reason, device_fit,
           patient_satisfaction, prosthetist_name, followup_recommended, next_appointment
    FROM discharge_forms
    WHERE patient_id = ?
    ORDER BY created_at DESC
  `).all(patientId);

  return NextResponse.json({ patient, consultations, orders: ordersWithItems, customOrders, dischargeForms });
}
