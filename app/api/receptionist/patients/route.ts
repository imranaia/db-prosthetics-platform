import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';
import { formatPatientId } from '@/lib/patient-id';

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
  const q = req.nextUrl.searchParams.get('q')?.trim();

  const patients = q
    ? db.prepare(
        `SELECT p.id, p.full_name, p.phone, p.patient_unique_id, u.email
         FROM patients p LEFT JOIN users u ON p.user_id = u.id
         WHERE p.full_name LIKE ? OR p.patient_unique_id LIKE ? OR p.phone LIKE ?
         ORDER BY p.created_at DESC LIMIT 30`
      ).all(`%${q}%`, `%${q}%`, `%${q}%`)
    : db.prepare(
        `SELECT p.id, p.full_name, p.phone, p.patient_unique_id, u.email
         FROM patients p LEFT JOIN users u ON p.user_id = u.id
         WHERE p.registering_hospital_id = ?
         ORDER BY p.created_at DESC LIMIT 50`
      ).all(hospital.id);

  return NextResponse.json({ patients });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'receptionist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hospital = await getHospital(user.id);
  if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });

  const body = await req.json();
  const {
    full_name, email, phone, dob, address, state, lga,
    gender, marital_status, religion, occupation,
    next_of_kin_name, next_of_kin_relationship, next_of_kin_phone, referral_source,
    amputation_yes, amputation_level, amputation_side, amputation_date, amputation_cause,
    previous_prosthesis, allergies, functional_mobility_status, caregiver_info,
    declaration_signature,
  } = body;

  if (!full_name?.trim()) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
  if (!declaration_signature) return NextResponse.json({ error: 'A signature (or thumbprint) is required to complete registration.' }, { status: 400 });

  const db = getDb();

  let normalizedEmail: string | null = null;
  if (email?.trim()) {
    normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) return NextResponse.json({ error: 'A patient with this email already exists.' }, { status: 409 });
  }

  // Every patient gets a real temporary password now, whether or not they
  // have an email — Patient ID login checks the same password_hash as
  // Email login, so there's one credential per patient, not two.
  const tempPassword = Math.random().toString(36).slice(2, 10).toUpperCase() + Math.floor(Math.random() * 900 + 100);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const result = db.transaction(() => {
    const userResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password)
       VALUES (?, ?, 'patient', 1)`
    ).run(normalizedEmail, passwordHash);

    const userId = userResult.lastInsertRowid;

    const patientResult = db.prepare(
      `INSERT INTO patients (
        user_id, full_name, phone, dob, address, state, lga,
        gender, marital_status, religion, occupation,
        next_of_kin_name, next_of_kin_relationship, next_of_kin_phone, referral_source,
        amputation_yes, amputation_level, amputation_side, amputation_date, amputation_cause,
        previous_prosthesis, allergies, functional_mobility_status, caregiver_info,
        declaration_signed_at, declaration_signature,
        registering_hospital_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
    ).run(
      userId, full_name.trim(), phone || null, dob || null, address || null, state || null, lga || null,
      gender || null, marital_status || null, religion || null, occupation || null,
      next_of_kin_name || null, next_of_kin_relationship || null, next_of_kin_phone || null, referral_source || 'Hospital reception',
      amputation_yes ? 1 : 0, amputation_level || null, amputation_side || null, amputation_date || null, amputation_cause || null,
      previous_prosthesis || null, allergies || null, functional_mobility_status || null, caregiver_info || null,
      declaration_signature, hospital.id,
    );

    const patientId = patientResult.lastInsertRowid as number;
    const patientUniqueId = formatPatientId(patientId);
    db.prepare('UPDATE patients SET patient_unique_id = ? WHERE id = ?').run(patientUniqueId, patientId);

    return { patientUniqueId };
  })();

  if (normalizedEmail) {
    try {
      const { sendWelcomePatient } = await import('@/lib/email');
      await sendWelcomePatient({
        to: normalizedEmail,
        fullName: full_name.trim(),
        tempPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dbpando.com'}/login`,
      });
    } catch (e) {
      console.error('[receptionist/patients] welcome email failed:', e);
    }
  }

  return NextResponse.json({
    success: true,
    patient_unique_id: result.patientUniqueId,
    // No email on file — nothing was emailed, so hand the password back
    // for the receptionist to give the patient directly.
    password: normalizedEmail ? undefined : tempPassword,
  }, { status: 201 });
}
