import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import { sendAdminNewOrderNotification } from '@/lib/email';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  let rows: unknown[];

  const consentCols = `
        cf.patient_guardian_name, cf.patient_guardian_signature,
        cf.witness_name, cf.witness_signature,
        cf.clinician_name, cf.clinician_signature`;

  if (user.role === 'super_admin') {
    rows = db.prepare(`
      SELECT co.*,
        p.full_name AS patient_name,
        d.full_name AS doctor_name, ud.email AS doctor_email,
        pos.id AS pos_id, upos.email AS po_specialist_email,
        ${consentCols}
      FROM custom_orders co
      LEFT JOIN patients p ON co.patient_id = p.id
      LEFT JOIN doctors d ON co.doctor_id = d.id
      LEFT JOIN users ud ON d.user_id = ud.id
      LEFT JOIN po_specialists pos ON co.po_specialist_id = pos.id
      LEFT JOIN users upos ON pos.user_id = upos.id
      LEFT JOIN consent_forms cf ON cf.custom_order_id = co.id
      ORDER BY co.created_at DESC
    `).all();
  } else if (user.role === 'doctor') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    rows = db.prepare(`
      SELECT co.*, p.full_name AS patient_name, ${consentCols}
      FROM custom_orders co
      LEFT JOIN patients p ON co.patient_id = p.id
      LEFT JOIN consent_forms cf ON cf.custom_order_id = co.id
      WHERE co.doctor_id = ?
      ORDER BY co.created_at DESC
    `).all(doctor.id);
  } else if (user.role === 'po_specialist') {
    const specialist = db.prepare('SELECT id FROM po_specialists WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!specialist) return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
    rows = db.prepare(`
      SELECT co.*, p.full_name AS patient_name
      FROM custom_orders co
      LEFT JOIN patients p ON co.patient_id = p.id
      WHERE co.po_specialist_id = ?
      ORDER BY co.created_at DESC
    `).all(specialist.id);
  } else if (user.role === 'patient') {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    rows = db.prepare(`
      SELECT co.*
      FROM custom_orders co
      WHERE co.patient_id = ?
      ORDER BY co.created_at DESC
    `).all(patient.id);
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(rows);
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
    category?: string;
    description: string;
    photos?: string[];
    photos_affected?: string[];
    photos_unaffected?: string[];
    body_parts?: string;   // JSON string from BodySelector
    material_id?: number;
    patient_id?: number;
    payment_target?: string;
    consultation_id?: number;
    reorder_of_order_id?: number;
    reorder_of_custom_order_id?: number;
    reorder_reason?: string;
    consent?: {
      patient_guardian_name?: string;
      patient_guardian_signature?: string | null;
      witness_name?: string;
      witness_signature?: string | null;
      clinician_name?: string;
      clinician_signature?: string | null;
    };
  };

  if (!body.description?.trim()) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  }

  const db = getDb();

  // Patients can't submit a brand-new fabrication order from scratch — only
  // request a reorder/replacement of a device they already have. New orders
  // must go through a doctor, P&O specialist, or super admin.
  if (user.role === 'patient') {
    if (!body.reorder_of_order_id && !body.reorder_of_custom_order_id) {
      return NextResponse.json({ error: 'A reorder request must reference an existing order.' }, { status: 400 });
    }
    const patientForCheck = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!patientForCheck) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    if (body.reorder_of_order_id) {
      const owns = db.prepare('SELECT id FROM orders WHERE id = ? AND patient_id = ?').get(body.reorder_of_order_id, patientForCheck.id);
      if (!owns) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    if (body.reorder_of_custom_order_id) {
      const owns = db.prepare('SELECT id FROM custom_orders WHERE id = ? AND patient_id = ?').get(body.reorder_of_custom_order_id, patientForCheck.id);
      if (!owns) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    if (!body.reorder_reason?.trim()) {
      return NextResponse.json({ error: 'Please tell us why you need a reorder.' }, { status: 400 });
    }
  }

  // A patient isn't always attached yet (doctor/po_specialist can leave this
  // order unassigned for now) — consent is inherently patient-specific, so
  // only require it once a patient is actually named. Reorder requests skip
  // this since they reference a device already covered by prior consent.
  const patientKnown = (user.role === 'patient' && !body.reorder_of_order_id && !body.reorder_of_custom_order_id) || !!body.patient_id;
  if (patientKnown && !body.consent?.patient_guardian_signature) {
    return NextResponse.json({ error: 'Patient / Guardian signature is required to place a fabrication order.' }, { status: 400 });
  }

  const photosStr = body.photos ? JSON.stringify(body.photos) : null;
  const photosAffectedStr = body.photos_affected ? JSON.stringify(body.photos_affected) : null;
  const photosUnaffectedStr = body.photos_unaffected ? JSON.stringify(body.photos_unaffected) : null;
  const paymentTarget = body.payment_target || 'creator';

  let newOrderId: number | bigint | null = null;
  let patientIdForConsent: number | null = null;

  if (user.role === 'doctor' || user.role === 'super_admin') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not enabled — switch to Doctor Mode first.' }, { status: 404 });
    const result = db.prepare(`
      INSERT INTO custom_orders (doctor_id, patient_id, created_by_role, category, description, photos, photos_affected, photos_unaffected, body_parts, material_id, payment_target, consultation_id)
      VALUES (?, ?, 'doctor', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(doctor.id, body.patient_id || null, body.category || null, body.description.trim(), photosStr, photosAffectedStr, photosUnaffectedStr, body.body_parts || null, body.material_id || null, paymentTarget, body.consultation_id || null);
    newOrderId = result.lastInsertRowid;
    patientIdForConsent = body.patient_id || null;
  } else if (user.role === 'po_specialist') {
    const specialist = db.prepare('SELECT id FROM po_specialists WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!specialist) return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
    const result = db.prepare(`
      INSERT INTO custom_orders (po_specialist_id, patient_id, created_by_role, category, description, photos, photos_affected, photos_unaffected, body_parts, material_id, payment_target)
      VALUES (?, ?, 'po_specialist', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(specialist.id, body.patient_id || null, body.category || null, body.description.trim(), photosStr, photosAffectedStr, photosUnaffectedStr, body.body_parts || null, body.material_id || null, paymentTarget);
    newOrderId = result.lastInsertRowid;
    patientIdForConsent = body.patient_id || null;
  } else if (user.role === 'patient') {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    const result = db.prepare(`
      INSERT INTO custom_orders (patient_id, created_by_role, category, description, photos, photos_affected, photos_unaffected, body_parts, material_id, payment_target, reorder_of_order_id, reorder_of_custom_order_id, reorder_reason)
      VALUES (?, 'patient', ?, ?, ?, ?, ?, ?, ?, 'patient', ?, ?, ?)
    `).run(patient.id, body.category || null, body.description.trim(), photosStr, photosAffectedStr, photosUnaffectedStr, body.body_parts || null, body.material_id || null, body.reorder_of_order_id || null, body.reorder_of_custom_order_id || null, body.reorder_reason?.trim() || null);
    newOrderId = result.lastInsertRowid;
    patientIdForConsent = patient.id;
  }

  if (newOrderId && patientIdForConsent && body.consent?.patient_guardian_signature) {
    db.prepare(`
      INSERT INTO consent_forms (
        patient_id, consultation_id, custom_order_id, form_date,
        patient_guardian_name, patient_guardian_signature,
        witness_name, witness_signature,
        clinician_name, clinician_signature, conducted_by_role
      ) VALUES (?, ?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?)
    `).run(
      patientIdForConsent,
      body.consultation_id || null,
      newOrderId,
      body.consent.patient_guardian_name ?? null,
      body.consent.patient_guardian_signature ?? null,
      body.consent.witness_name ?? null,
      body.consent.witness_signature ?? null,
      body.consent.clinician_name ?? null,
      body.consent.clinician_signature ?? null,
      user.role,
    );
  }

  if (newOrderId && patientIdForConsent) {
    try {
      const patient = db.prepare('SELECT full_name FROM patients WHERE id = ?').get(patientIdForConsent) as { full_name: string } | undefined;
      const createdByRole = user.role === 'super_admin' ? 'doctor' : user.role;
      await sendAdminNewOrderNotification({
        orderId: newOrderId as number,
        orderType: 'custom_order',
        patientName: patient?.full_name || `Patient #${patientIdForConsent}`,
        createdByRole,
        description: body.description.trim(),
        category: body.category || null,
        productTotalKobo: null, // quoted by admin after review
        serviceFeeKobo: 100000,
        paymentTarget,
        adminUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/super-admin/orders`,
      });
    } catch (e) {
      console.error('[orders/custom] admin notification failed', e);
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    id: number;
    status?: string;
    quoted_price?: number;
    admin_notes?: string;
    payment_target?: string;
    fulfillment_status?: string;
  };

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.status !== undefined)        { setClauses.push('status = ?');        values.push(body.status); }
  if (body.quoted_price !== undefined)  { setClauses.push('quoted_price = ?');  values.push(Math.round(body.quoted_price)); }
  if (body.admin_notes !== undefined)   { setClauses.push('admin_notes = ?');   values.push(body.admin_notes); }
  if (body.payment_target !== undefined){ setClauses.push('payment_target = ?'); values.push(body.payment_target); }
  if (body.fulfillment_status !== undefined) { setClauses.push('fulfillment_status = ?'); values.push(body.fulfillment_status); }

  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  values.push(body.id);
  db.prepare(`UPDATE custom_orders SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  return NextResponse.json({ success: true });
}
