import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  let orders: unknown[];

  if (user.role === 'super_admin') {
    orders = db.prepare(`
      SELECT o.*, p.full_name AS patient_name
      FROM orders o
      LEFT JOIN patients p ON o.patient_id = p.id
      ORDER BY o.created_at DESC
    `).all();
  } else if (user.role === 'doctor') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    orders = db.prepare(`
      SELECT o.*, p.full_name AS patient_name
      FROM orders o
      LEFT JOIN patients p ON o.patient_id = p.id
      WHERE o.created_by_role = 'doctor' AND o.created_by_id = ?
      ORDER BY o.created_at DESC
    `).all(doctor.id);
  } else if (user.role === 'po_specialist') {
    const specialist = db.prepare('SELECT id FROM po_specialists WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!specialist) return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
    orders = db.prepare(`
      SELECT o.*, p.full_name AS patient_name
      FROM orders o
      LEFT JOIN patients p ON o.patient_id = p.id
      WHERE o.created_by_role = 'po_specialist' AND o.created_by_id = ?
      ORDER BY o.created_at DESC
    `).all(specialist.id);
  } else if (user.role === 'patient') {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    orders = db.prepare(`
      SELECT o.*
      FROM orders o
      WHERE o.patient_id = ? AND o.payment_target = 'patient'
      ORDER BY o.created_at DESC
    `).all(patient.id);
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Attach items to each order
  const orderIds = (orders as Array<{ id: number }>).map(o => o.id);
  let itemsByOrder: Record<number, Array<{ product_name: string; quantity: number; price_at_order: number }>> = {};

  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',');
    const items = db.prepare(`
      SELECT oi.order_id, pr.name AS product_name, oi.quantity, oi.price_at_order
      FROM order_items oi
      LEFT JOIN products pr ON oi.product_id = pr.id
      WHERE oi.order_id IN (${placeholders})
    `).all(...orderIds) as Array<{ order_id: number; product_name: string; quantity: number; price_at_order: number }>;

    for (const item of items) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }
  }

  const result = (orders as Array<Record<string, unknown>>).map(o => ({
    ...o,
    items: itemsByOrder[(o.id as number)] ?? [],
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowedRoles = ['doctor', 'super_admin', 'po_specialist', 'patient'];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json() as {
    patient_id?: number;
    items: Array<{ product_id: number; quantity: number }>;
    payment_method?: string;
    payment_target?: string;
    consent?: {
      patient_guardian_name?: string;
      patient_guardian_signature?: string | null;
      witness_name?: string;
      witness_signature?: string | null;
      clinician_name?: string;
      clinician_signature?: string | null;
    };
  };

  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: 'items is required and must not be empty.' }, { status: 400 });
  }

  const db = getDb();

  // Validate products and calculate total
  let totalKobo = 0;
  let requiresConsent = false;
  const itemDetails: Array<{ product_id: number; quantity: number; price_at_order: number; name: string }> = [];

  for (const item of body.items) {
    const product = db.prepare('SELECT id, name, price, in_stock, type FROM products WHERE id = ?').get(item.product_id) as
      { id: number; name: string; price: number; in_stock: number; type: string } | undefined;
    if (!product) return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 400 });
    if (!product.in_stock) return NextResponse.json({ error: `Product "${product.name}" is out of stock` }, { status: 400 });
    if (product.type === 'complete') requiresConsent = true;
    itemDetails.push({ product_id: item.product_id, quantity: item.quantity, price_at_order: product.price, name: product.name });
    totalKobo += product.price * item.quantity;
  }

  // A complete device (not just a spare part) requires the patient's
  // fabrication/fitting consent, captured inline on this same order form.
  if (requiresConsent && !body.consent?.patient_guardian_signature) {
    return NextResponse.json({ error: 'Patient / Guardian signature is required to order a complete device.' }, { status: 400 });
  }

  // Resolve caller identity
  let createdByRole = user.role;
  let createdById: number | null = null;
  let patientId = body.patient_id || null;

  if (user.role === 'doctor' || user.role === 'super_admin') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not enabled — switch to Doctor Mode first.' }, { status: 404 });
    createdById = doctor.id;
    createdByRole = 'doctor';
  } else if (user.role === 'po_specialist') {
    const specialist = db.prepare('SELECT id FROM po_specialists WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!specialist) return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
    createdById = specialist.id;
  } else if (user.role === 'patient') {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    patientId = patient.id;
    createdByRole = 'patient';
  }

  const paymentTarget = body.payment_target || 'creator';
  const paymentMethod = body.payment_method || 'paystack';

  const createOrder = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (patient_id, total_amount, payment_method, payment_target, status, payment_status, created_by_role, created_by_id)
      VALUES (?, ?, ?, ?, 'pending', 'unpaid', ?, ?)
    `).run(patientId, totalKobo, paymentMethod, paymentTarget, createdByRole, createdById);

    const orderId = orderResult.lastInsertRowid;

    for (const item of itemDetails) {
      db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price_at_order) VALUES (?, ?, ?, ?)').run(
        orderId, item.product_id, item.quantity, item.price_at_order
      );
    }

    if (requiresConsent && patientId) {
      db.prepare(`
        INSERT INTO consent_forms (
          patient_id, order_id, form_date,
          patient_guardian_name, patient_guardian_signature,
          witness_name, witness_signature,
          clinician_name, clinician_signature, conducted_by_role
        ) VALUES (?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?)
      `).run(
        patientId,
        orderId,
        body.consent?.patient_guardian_name ?? null,
        body.consent?.patient_guardian_signature ?? null,
        body.consent?.witness_name ?? null,
        body.consent?.witness_signature ?? null,
        body.consent?.clinician_name ?? null,
        body.consent?.clinician_signature ?? null,
        user.role,
      );
    }

    return orderId;
  });

  const orderId = createOrder();

  return NextResponse.json({ success: true, order_id: orderId, total_kobo: totalKobo }, { status: 201 });
}
