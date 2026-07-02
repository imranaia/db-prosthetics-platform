import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  let rows: unknown[];

  if (user.role === 'super_admin') {
    rows = db.prepare(`
      SELECT co.*,
        p.full_name AS patient_name,
        d.full_name AS doctor_name, ud.email AS doctor_email,
        pos.id AS pos_id, upos.email AS po_specialist_email
      FROM custom_orders co
      LEFT JOIN patients p ON co.patient_id = p.id
      LEFT JOIN doctors d ON co.doctor_id = d.id
      LEFT JOIN users ud ON d.user_id = ud.id
      LEFT JOIN po_specialists pos ON co.po_specialist_id = pos.id
      LEFT JOIN users upos ON pos.user_id = upos.id
      ORDER BY co.created_at DESC
    `).all();
  } else if (user.role === 'doctor') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    rows = db.prepare(`
      SELECT co.*, p.full_name AS patient_name
      FROM custom_orders co
      LEFT JOIN patients p ON co.patient_id = p.id
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
      WHERE co.patient_id = ? AND co.payment_target = 'patient'
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

  const allowedRoles = ['doctor', 'po_specialist', 'patient'];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json() as {
    category?: string;
    description: string;
    photos?: string[];
    patient_id?: number;
    payment_target?: string;
  };

  if (!body.description?.trim()) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
  }

  const db = getDb();
  const photosStr = body.photos ? JSON.stringify(body.photos) : null;
  const paymentTarget = body.payment_target || 'creator';

  if (user.role === 'doctor') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    db.prepare(`
      INSERT INTO custom_orders (doctor_id, patient_id, created_by_role, category, description, photos, payment_target)
      VALUES (?, ?, 'doctor', ?, ?, ?, ?)
    `).run(doctor.id, body.patient_id || null, body.category || null, body.description.trim(), photosStr, paymentTarget);
  } else if (user.role === 'po_specialist') {
    const specialist = db.prepare('SELECT id FROM po_specialists WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!specialist) return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
    db.prepare(`
      INSERT INTO custom_orders (po_specialist_id, patient_id, created_by_role, category, description, photos, payment_target)
      VALUES (?, ?, 'po_specialist', ?, ?, ?, ?)
    `).run(specialist.id, body.patient_id || null, body.category || null, body.description.trim(), photosStr, paymentTarget);
  } else if (user.role === 'patient') {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id) as { id: number } | undefined;
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    db.prepare(`
      INSERT INTO custom_orders (patient_id, created_by_role, category, description, photos, payment_target)
      VALUES (?, 'patient', ?, ?, ?, 'creator')
    `).run(patient.id, body.category || null, body.description.trim(), photosStr);
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
  };

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.status !== undefined)        { setClauses.push('status = ?');        values.push(body.status); }
  if (body.quoted_price !== undefined)  { setClauses.push('quoted_price = ?');  values.push(Math.round(body.quoted_price)); }
  if (body.admin_notes !== undefined)   { setClauses.push('admin_notes = ?');   values.push(body.admin_notes); }
  if (body.payment_target !== undefined){ setClauses.push('payment_target = ?'); values.push(body.payment_target); }

  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  values.push(body.id);
  db.prepare(`UPDATE custom_orders SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  return NextResponse.json({ success: true });
}
