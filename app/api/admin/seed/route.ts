import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const hash = bcrypt.hashSync('1234', 12); // test password for all accounts

  db.transaction(() => {
    // Update super admin password to 1234 first
    db.prepare(`UPDATE users SET password_hash = ? WHERE role = 'super_admin'`).run(hash);

    // ── Clear all data (order matters for FK constraints) ──
    db.exec(`
      DELETE FROM discharge_forms;
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM appointments;
      DELETE FROM consultations;
      DELETE FROM body_assessments;
      DELETE FROM po_specialists;
      DELETE FROM doctors;
      DELETE FROM patients;
      DELETE FROM hospitals;
      DELETE FROM team_members;
      DELETE FROM products;
      DELETE FROM site_content;
      DELETE FROM users WHERE role != 'super_admin';
    `);

    // ── Products ──
    db.prepare(`INSERT INTO products (name, category, type, price, description, in_stock) VALUES
      ('Below-Knee Prosthetic Limb', 'lower_limb', 'complete', 35000000, 'Custom-fitted below-knee prosthesis with silicone liner and carbon foot', 1),
      ('Above-Knee Prosthetic Limb', 'lower_limb', 'complete', 65000000, 'Microprocessor-controlled above-knee prosthesis', 1),
      ('Prosthetic Hand', 'upper_limb', 'complete', 45000000, 'Multi-articulating prosthetic hand with grip patterns', 1),
      ('Spinal Brace (TLSO)', 'spinal', 'complete', 18000000, 'Thoracic-Lumbar-Sacral Orthosis for spinal support', 1),
      ('Silicone Liner', 'lower_limb', 'part', 2500000, 'Replacement silicone liner for below-knee socket', 1),
      ('Carbon Fibre Foot', 'lower_limb', 'part', 8000000, 'Energy-return carbon fibre prosthetic foot', 1)
    `).run();

    // ── Team members ──
    db.prepare(`INSERT INTO team_members (name, position, bio, display_order) VALUES
      ('Dr. Emmanuel Bello', 'Chief Prosthetist & Orthotist', 'Over 15 years of clinical experience in prosthetics and orthotics across Nigeria.', 1),
      ('Mrs. Fatima Al-Hassan', 'Senior P&O Specialist', 'Specialist in paediatric orthotics and lower limb prosthetics.', 2),
      ('Mr. Chukwuemeka Obi', 'Rehabilitation Therapist', 'Expert in gait training and post-fitting rehabilitation.', 3)
    `).run();

    // ── Site content ──
    const contents: [string, string][] = [
      ['hero_heading', 'Rebuilding Lives. Restoring Dignity.'],
      ['hero_subheading', 'Nigeria\'s certified Prosthetics & Orthotics specialists — delivering precision care across all 36 states.'],
      ['services', JSON.stringify([
        { title: 'Lower Limb Prosthetics', description: 'Below-knee, above-knee, and hip disarticulation prostheses fitted to your exact measurements.' },
        { title: 'Upper Limb Prosthetics', description: 'Functional and cosmetic upper limb solutions for partial and total limb loss.' },
        { title: 'Orthotics & Bracing', description: 'Custom spinal, lower limb, and upper limb orthoses for injury and condition management.' },
      ])],
      ['portfolio', JSON.stringify([
        { title: 'Below-Knee Fitting', description: 'Patient fitted with carbon-fibre running blade' },
        { title: 'Paediatric Orthotics', description: 'Custom KAFO for 8-year-old patient' },
        { title: 'Upper Limb Restoration', description: 'Myoelectric hand prosthesis fitting' },
      ])],
    ];
    for (const [key, value] of contents) {
      db.prepare(`INSERT OR REPLACE INTO site_content (key, value) VALUES (?, ?)`).run(key, value);
    }

    // ── Hospital ──
    const hospitalAdminResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('hospitaladmin@test.com', ?, 'hospital_admin', 0)`
    ).run(hash);

    const hospitalResult = db.prepare(
      `INSERT INTO hospitals (name, state, lga, landmark, address, admin_user_id) VALUES (?, ?, ?, ?, ?, ?)`
    ).run('Maiduguri General Prosthetics Centre', 'Borno', 'Maiduguri', 'Near University of Maiduguri Teaching Hospital', '12 Kashim Ibrahim Road, Maiduguri', hospitalAdminResult.lastInsertRowid);
    const hospitalId = hospitalResult.lastInsertRowid as number;

    // ── Doctor ──
    const doctorUserResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('doctor@test.com', ?, 'doctor', 0)`
    ).run(hash);
    const doctorResult = db.prepare(
      `INSERT INTO doctors (user_id, hospital_id) VALUES (?, ?)`
    ).run(doctorUserResult.lastInsertRowid, hospitalId);
    const doctorId = doctorResult.lastInsertRowid as number;

    // ── P&O Specialist ──
    const poUserResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('specialist@test.com', ?, 'po_specialist', 0)`
    ).run(hash);
    const poResult = db.prepare(
      `INSERT INTO po_specialists (user_id, hospital_id) VALUES (?, ?)`
    ).run(poUserResult.lastInsertRowid, hospitalId);
    const poId = poResult.lastInsertRowid as number;

    // ── Patient 1 (with portal account) ──
    const p1UserResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('patient1@test.com', ?, 'patient', 0)`
    ).run(hash);
    const p1Result = db.prepare(`
      INSERT INTO patients (user_id, full_name, phone, dob, state, lga, address, gender, marital_status, occupation, next_of_kin_name, next_of_kin_relationship, next_of_kin_phone, amputation_yes, amputation_level, amputation_side, amputation_cause)
      VALUES (?, 'Amaka Okonkwo', '08034567890', '1990-05-14', 'Borno', 'Maiduguri', '45 Bama Road, Maiduguri', 'Female', 'Single', 'Teacher', 'Ngozi Okonkwo', 'Sister', '08023456789', 1, 'Below Knee (BK)', 'Left', 'Road Traffic Accident')
    `).run(p1UserResult.lastInsertRowid);
    const p1Id = p1Result.lastInsertRowid as number;

    // ── Patient 2 (with portal account) ──
    const p2Result = db.prepare(`
      INSERT INTO patients (full_name, phone, dob, state, lga, address, gender, marital_status, occupation, next_of_kin_name, next_of_kin_relationship, next_of_kin_phone)
      VALUES ('Ibrahim Musa', '07056789012', '1975-11-03', 'Borno', 'Jere', '8 Yerwa Estate, Maiduguri', 'Male', 'Married', 'Farmer', 'Aisha Musa', 'Wife', '07045678901')
    `).run();
    const p2Id = p2Result.lastInsertRowid as number;

    // Add portal user for patient 2
    const p2UserResult = db.prepare(
      `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('patient2@test.com', ?, 'patient', 0)`
    ).run(hash);
    db.prepare(`UPDATE patients SET user_id = ? WHERE id = ?`).run(p2UserResult.lastInsertRowid, p2Id);

    // ── Consultation 1 (for patient 1, by doctor) ──
    const c1Result = db.prepare(`
      INSERT INTO consultations (patient_id, doctor_id, conducted_by_role, hospital_id, assessor_name, chief_complaint, medical_history, physical_assessment, patient_goals, recommended_device, followup_date, notes, consent_given, body_parts)
      VALUES (?, ?, 'doctor', ?, 'Dr. Emmanuel Bello', 'Below-knee amputation — left leg. Requesting prosthetic fitting.', 'Road traffic accident 6 months ago. Left leg amputated below the knee at UMTH. No infection. Wound fully healed.', ?, 'Return to walking independently, return to teaching job.', 'Below-Knee Endoskeletal Prosthesis with Carbon Foot', '2026-07-15', 'Patient is highly motivated and cooperative. Residual limb is well-shaped, suitable for immediate fitting.', 1, ?)
    `).run(
      p1Id,
      doctorId,
      hospitalId,
      JSON.stringify({ residual_limb: { findings: 'Cylindrical shape, 18cm length, intact skin, no oedema', notes: 'Good candidate for PTB socket' }, rom: { findings: 'Full knee ROM, no contractures', notes: '' }, muscle_strength: { findings: '4/5 hip flexors and extensors', notes: '' }, sensation_pain: { findings: 'Normal sensation, mild phantom limb sensation', notes: 'Patient reports manageable phantom pain' }, gait: { findings: 'N/A — pre-prosthetic', notes: '' }, functional_mobility: { findings: 'Independent with crutches', notes: '' } }),
      JSON.stringify([{ region: 'left-shin', label: 'Left Shin', subParts: [] }, { region: 'left-ankle', label: 'Left Ankle', subParts: [] }]),
    );
    const c1Id = c1Result.lastInsertRowid as number;

    // ── Consultation 2 (for patient 2, by super admin) ──
    db.prepare(`
      INSERT INTO consultations (patient_id, conducted_by_role, hospital_id, assessor_name, chief_complaint, medical_history, patient_goals, recommended_device, notes, consent_given, body_parts)
      VALUES (?, 'super_admin', ?, 'DB Prosthetics Team', 'Above-knee amputation — right leg. Initial assessment.', 'Diabetic complications leading to above-knee amputation 2 years ago. Currently using wheelchair.', 'Improved mobility, reduce dependence on wheelchair.', 'Microprocessor Knee with Dynamic Foot', 'Patient has been waiting 18 months. Eager to proceed with fitting.', 1, ?)
    `).run(
      p2Id,
      hospitalId,
      JSON.stringify([{ region: 'right-thigh', label: 'Right Thigh', subParts: [] }, { region: 'right-knee', label: 'Right Knee', subParts: [] }]),
    );

    // ── Appointment (for patient 1) ──
    db.prepare(`
      INSERT INTO appointments (patient_id, type, status, assigned_hospital_id, quoted_price, service_fee, payment_status, scheduled_date, notes)
      VALUES (?, 'hospital', 'confirmed', ?, NULL, 100000, 'not_required', '2026-07-15 10:00:00', 'First prosthetic fitting appointment. Please bring physiotherapy referral letter.')
    `).run(p1Id, hospitalId);

    // ── Appointment 2 — home visit with quote (for payment testing) ──
    db.prepare(`
      INSERT INTO appointments (patient_id, type, status, assigned_hospital_id, quoted_price, service_fee, payment_status, notes)
      VALUES (?, 'home', 'quoted', ?, 2500000, 100000, 'unpaid', 'Home assessment visit to evaluate fitting environment and measure for socket.')
    `).run(p1Id, hospitalId);

    // ── Order (for patient 1) ──
    const productRow = db.prepare(`SELECT id, price FROM products WHERE name = 'Below-Knee Prosthetic Limb'`).get() as any;
    if (productRow) {
      const orderResult = db.prepare(`
        INSERT INTO orders (patient_id, hospital_id, po_specialist_id, created_by_role, status, total_amount, service_fee, payment_method, payment_status)
        VALUES (?, ?, ?, 'doctor', 'processing', ?, 100000, 'transfer', 'paid')
      `).run(p1Id, hospitalId, poId, productRow.price + 100000);
      db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, price_at_order) VALUES (?, ?, 1, ?)`).run(orderResult.lastInsertRowid, productRow.id, productRow.price);
    }

    // ── Discharge form (for patient 1, consultation 1) ──
    db.prepare(`
      INSERT INTO discharge_forms (patient_id, consultation_id, hospital_id, device_fit, alignment_function, skin_condition, pain_discomfort, gait_mobility, patient_satisfaction, training_donning, training_care, training_skin, training_troubleshooting, discharge_date, discharge_reason, followup_recommended, next_appointment, prosthetist_name, patient_signature_name, conducted_by_role)
      VALUES (?, ?, ?, 'Excellent fit, no pressure areas noted, patient comfortable after 2-hour wear trial', 'Alignment verified by gait analysis, functional and cosmetically acceptable', 'Skin intact, no redness or breakdown after trial', 'No pain reported during ambulation', 'Independent ambulation achieved on level surfaces, mild gait deviation improving', 'Very satisfied, emotional during first steps', 1, 1, 1, 1, '2026-07-02', 'Successful prosthetic fitting — patient achieved functional ambulation', 1, '2026-08-02', 'Dr. Emmanuel Bello', 'Amaka Okonkwo', 'doctor')
    `).run(p1Id, c1Id, hospitalId);

  })();

  return NextResponse.json({
    success: true,
    accounts: [
      { role: 'super_admin', email: 'admin@dbprosthetics.com', password: '1234', note: 'Uses ADMIN_SEED_EMAIL env var or default' },
      { role: 'hospital_admin', email: 'hospitaladmin@test.com', password: '1234' },
      { role: 'doctor', email: 'doctor@test.com', password: '1234' },
      { role: 'po_specialist', email: 'specialist@test.com', password: '1234' },
      { role: 'patient', email: 'patient1@test.com', password: '1234', note: 'Has full records: consultation, appointment, order, discharge form' },
      { role: 'patient', email: 'patient2@test.com', password: '1234', note: 'Admin-registered patient with portal account' },
    ],
  });
}
