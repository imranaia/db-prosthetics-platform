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
  const hash = bcrypt.hashSync('1234', 12);

  try {
    // Turn off FK constraints so tables can be cleared in any order
    db.pragma('foreign_keys = OFF');

    // Wipe all data — individual prepare().run() calls (NOT db.exec inside a transaction)
    db.prepare('DELETE FROM discharge_forms').run();
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM appointments').run();
    db.prepare('DELETE FROM consultations').run();
    db.prepare('DELETE FROM body_assessments').run();
    db.prepare('DELETE FROM po_specialists').run();
    db.prepare('DELETE FROM doctors').run();
    db.prepare('DELETE FROM patients').run();
    db.prepare('DELETE FROM hospitals').run();
    db.prepare('DELETE FROM team_members').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM site_content').run();
    db.prepare("DELETE FROM users WHERE role != 'super_admin'").run();
    // Reset autoincrement counters (skip _migrations)
    db.prepare("DELETE FROM sqlite_sequence WHERE name != '_migrations'").run();

    // Set super admin password to 1234
    db.prepare("UPDATE users SET password_hash = ? WHERE role = 'super_admin'").run(hash);

    // Re-enable FK constraints before seeding
    db.pragma('foreign_keys = ON');

    // Seed everything inside one transaction
    db.transaction(() => {

      // ── Products ──
      const ip = db.prepare(
        `INSERT INTO products (name, category, type, price, description, in_stock) VALUES (?, ?, ?, ?, ?, 1)`
      );
      ip.run('Below-Knee Prosthetic Limb',  'lower_limb', 'complete', 35000000, 'Custom-fitted below-knee prosthesis with silicone liner and carbon foot');
      ip.run('Above-Knee Prosthetic Limb',  'lower_limb', 'complete', 65000000, 'Microprocessor-controlled above-knee prosthesis');
      ip.run('Prosthetic Hand',              'upper_limb', 'complete', 45000000, 'Multi-articulating prosthetic hand with grip patterns');
      ip.run('Spinal Brace (TLSO)',          'spinal',     'complete', 18000000, 'Thoracic-Lumbar-Sacral Orthosis for spinal support');
      ip.run('Silicone Liner',               'lower_limb', 'part',     2500000, 'Replacement silicone liner for below-knee socket');
      ip.run('Carbon Fibre Foot',            'lower_limb', 'part',     8000000, 'Energy-return carbon fibre prosthetic foot');

      // ── Team members ──
      const it = db.prepare(`INSERT INTO team_members (name, position, bio, display_order) VALUES (?, ?, ?, ?)`);
      it.run('Dr. Emmanuel Bello',     'Chief Prosthetist & Orthotist', 'Over 15 years of clinical experience in prosthetics and orthotics across Nigeria.', 1);
      it.run('Mrs. Fatima Al-Hassan',  'Senior P&O Specialist',         'Specialist in paediatric orthotics and lower limb prosthetics.', 2);
      it.run('Mr. Chukwuemeka Obi',    'Rehabilitation Therapist',      'Expert in gait training and post-fitting rehabilitation.', 3);

      // ── Site content ──
      const ic = db.prepare(`INSERT OR REPLACE INTO site_content (key, value) VALUES (?, ?)`);
      ic.run('hero_heading',    'Rebuilding Lives. Restoring Dignity.');
      ic.run('hero_subheading', "Nigeria's certified Prosthetics & Orthotics specialists — delivering precision care across all 36 states.");
      ic.run('services', JSON.stringify([
        { title: 'Lower Limb Prosthetics', description: 'Below-knee, above-knee, and hip disarticulation prostheses fitted to your exact measurements.' },
        { title: 'Upper Limb Prosthetics', description: 'Functional and cosmetic upper limb solutions for partial and total limb loss.' },
        { title: 'Orthotics & Bracing',    description: 'Custom spinal, lower limb, and upper limb orthoses for injury and condition management.' },
      ]));
      ic.run('portfolio', JSON.stringify([
        { title: 'Below-Knee Fitting',    description: 'Patient fitted with carbon-fibre running blade' },
        { title: 'Paediatric Orthotics',  description: 'Custom KAFO for 8-year-old patient' },
        { title: 'Upper Limb Restoration',description: 'Myoelectric hand prosthesis fitting' },
      ]));

      // ── Hospital admin ──
      const hospitalAdminUserId = (db.prepare(
        `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('hospitaladmin@test.com', ?, 'hospital_admin', 0)`
      ).run(hash)).lastInsertRowid;

      // ── Hospital ──
      const hospitalId = (db.prepare(
        `INSERT INTO hospitals (name, state, lga, landmark, address, admin_user_id) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        'Maiduguri General Prosthetics Centre', 'Borno', 'Maiduguri',
        'Near University of Maiduguri Teaching Hospital',
        '12 Kashim Ibrahim Road, Maiduguri',
        hospitalAdminUserId
      )).lastInsertRowid as number;

      // ── Doctor ──
      const doctorUserId = (db.prepare(
        `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('doctor@test.com', ?, 'doctor', 0)`
      ).run(hash)).lastInsertRowid;
      const doctorId = (db.prepare(
        `INSERT INTO doctors (user_id, hospital_id) VALUES (?, ?)`
      ).run(doctorUserId, hospitalId)).lastInsertRowid as number;

      // ── P&O Specialist ──
      const poUserId = (db.prepare(
        `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('specialist@test.com', ?, 'po_specialist', 0)`
      ).run(hash)).lastInsertRowid;
      const poId = (db.prepare(
        `INSERT INTO po_specialists (user_id, hospital_id) VALUES (?, ?)`
      ).run(poUserId, hospitalId)).lastInsertRowid as number;

      // ── Patient 1 — full portal + all record types ──
      const p1UserId = (db.prepare(
        `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('patient1@test.com', ?, 'patient', 0)`
      ).run(hash)).lastInsertRowid;
      const p1Id = (db.prepare(`
        INSERT INTO patients
          (user_id, full_name, phone, dob, state, lga, address, gender, marital_status, occupation,
           next_of_kin_name, next_of_kin_relationship, next_of_kin_phone,
           amputation_yes, amputation_level, amputation_side, amputation_cause)
        VALUES (?, 'Amaka Okonkwo', '08034567890', '1990-05-14', 'Borno', 'Maiduguri',
          '45 Bama Road, Maiduguri', 'Female', 'Single', 'Teacher',
          'Ngozi Okonkwo', 'Sister', '08023456789',
          1, 'Below Knee (BK)', 'Left', 'Road Traffic Accident')
      `).run(p1UserId)).lastInsertRowid as number;

      // ── Patient 2 — portal account ──
      const p2UserId = (db.prepare(
        `INSERT INTO users (email, password_hash, role, must_change_password) VALUES ('patient2@test.com', ?, 'patient', 0)`
      ).run(hash)).lastInsertRowid;
      const p2Id = (db.prepare(`
        INSERT INTO patients
          (user_id, full_name, phone, dob, state, lga, address, gender, marital_status, occupation,
           next_of_kin_name, next_of_kin_relationship, next_of_kin_phone)
        VALUES (?, 'Ibrahim Musa', '07056789012', '1975-11-03', 'Borno', 'Jere',
          '8 Yerwa Estate, Maiduguri', 'Male', 'Married', 'Farmer',
          'Aisha Musa', 'Wife', '07045678901')
      `).run(p2UserId)).lastInsertRowid as number;

      // ── Consultation 1 — Patient 1, doctor ──
      const pa1 = JSON.stringify({
        residual_limb:       { findings: 'Cylindrical shape, 18cm length, intact skin, no oedema', notes: 'Good candidate for PTB socket' },
        rom:                 { findings: 'Full knee ROM, no contractures', notes: '' },
        muscle_strength:     { findings: '4/5 hip flexors and extensors', notes: '' },
        sensation_pain:      { findings: 'Normal sensation, mild phantom limb sensation', notes: 'Manageable phantom pain' },
        gait:                { findings: 'N/A — pre-prosthetic', notes: '' },
        functional_mobility: { findings: 'Independent with crutches', notes: '' },
      });
      const bp1 = JSON.stringify([
        { region: 'left-shin',  label: 'Left Shin',  subParts: [] },
        { region: 'left-ankle', label: 'Left Ankle', subParts: [] },
      ]);
      const c1Id = (db.prepare(`
        INSERT INTO consultations
          (patient_id, doctor_id, conducted_by_role, hospital_id, assessor_name,
           chief_complaint, medical_history, physical_assessment,
           patient_goals, recommended_device, followup_date, notes, consent_given, body_parts)
        VALUES (?, ?, 'doctor', ?, 'Dr. Emmanuel Bello',
          'Below-knee amputation — left leg. Requesting prosthetic fitting.',
          'Road traffic accident 6 months ago. Left leg amputated below the knee at UMTH. No infection. Wound fully healed.',
          ?,
          'Return to walking independently, return to teaching job.',
          'Below-Knee Endoskeletal Prosthesis with Carbon Foot',
          '2026-07-15',
          'Patient is highly motivated. Residual limb well-shaped, suitable for immediate fitting.',
          1, ?)
      `).run(p1Id, doctorId, hospitalId, pa1, bp1)).lastInsertRowid as number;

      // ── Consultation 2 — Patient 2, super admin ──
      const bp2 = JSON.stringify([
        { region: 'right-thigh', label: 'Right Thigh', subParts: [] },
        { region: 'right-knee',  label: 'Right Knee',  subParts: [] },
      ]);
      db.prepare(`
        INSERT INTO consultations
          (patient_id, conducted_by_role, hospital_id, assessor_name,
           chief_complaint, medical_history, patient_goals, recommended_device, notes, consent_given, body_parts)
        VALUES (?, 'super_admin', ?, 'DB Prosthetics Team',
          'Above-knee amputation — right leg. Initial assessment.',
          'Diabetic complications leading to above-knee amputation 2 years ago. Currently using wheelchair.',
          'Improved mobility, reduce dependence on wheelchair.',
          'Microprocessor Knee with Dynamic Foot',
          'Patient waiting 18 months. Eager to proceed.', 1, ?)
      `).run(p2Id, hospitalId, bp2);

      // ── Appointments — Patient 1 ──
      db.prepare(`
        INSERT INTO appointments
          (patient_id, type, status, assigned_hospital_id, service_fee, payment_status, scheduled_date, notes)
        VALUES (?, 'hospital', 'confirmed', ?, 100000, 'not_required', '2026-07-15 10:00:00',
          'First prosthetic fitting appointment. Please bring physiotherapy referral letter.')
      `).run(p1Id, hospitalId);

      db.prepare(`
        INSERT INTO appointments
          (patient_id, type, status, assigned_hospital_id, quoted_price, service_fee, payment_status, notes)
        VALUES (?, 'home', 'quoted', ?, 2500000, 100000, 'unpaid',
          'Home assessment to evaluate fitting environment and measure for socket.')
      `).run(p1Id, hospitalId);

      // ── Order — Patient 1 ──
      const product = db.prepare(
        `SELECT id, price FROM products WHERE name = 'Below-Knee Prosthetic Limb'`
      ).get() as { id: number; price: number } | undefined;
      if (product) {
        const orderId = (db.prepare(`
          INSERT INTO orders
            (patient_id, hospital_id, po_specialist_id, created_by_role, status, total_amount, service_fee, payment_method, payment_status)
          VALUES (?, ?, ?, 'doctor', 'processing', ?, 100000, 'transfer', 'paid')
        `).run(p1Id, hospitalId, poId, product.price + 100000)).lastInsertRowid;
        db.prepare(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_order) VALUES (?, ?, 1, ?)`
        ).run(orderId, product.id, product.price);
      }

      // ── Discharge form — Patient 1 ──
      db.prepare(`
        INSERT INTO discharge_forms (
          patient_id, consultation_id, hospital_id,
          device_fit, alignment_function, skin_condition, pain_discomfort, gait_mobility, patient_satisfaction,
          training_donning, training_care, training_skin, training_troubleshooting,
          discharge_date, discharge_reason, followup_recommended, next_appointment,
          prosthetist_name, patient_signature_name, conducted_by_role
        ) VALUES (?, ?, ?,
          'Excellent fit, no pressure areas after 2-hour wear trial',
          'Alignment verified by gait analysis, functionally acceptable',
          'Skin intact, no redness or breakdown',
          'No pain during ambulation',
          'Independent ambulation on level surfaces achieved',
          'Very satisfied — emotional during first steps',
          1, 1, 1, 1,
          '2026-07-02', 'Successful fitting — patient achieved functional ambulation',
          1, '2026-08-02',
          'Dr. Emmanuel Bello', 'Amaka Okonkwo', 'doctor')
      `).run(p1Id, c1Id, hospitalId);

    })();

    return NextResponse.json({
      success: true,
      message: 'Database reset and seeded. All accounts use password: 1234',
      accounts: [
        { role: 'super_admin',    email: 'admin@dbprosthetics.com',  password: '1234', note: 'Or your ADMIN_SEED_EMAIL env var' },
        { role: 'hospital_admin', email: 'hospitaladmin@test.com',   password: '1234' },
        { role: 'doctor',         email: 'doctor@test.com',          password: '1234' },
        { role: 'po_specialist',  email: 'specialist@test.com',      password: '1234' },
        { role: 'patient',        email: 'patient1@test.com',        password: '1234', note: 'Has: consultation, 2 appointments, order, discharge form' },
        { role: 'patient',        email: 'patient2@test.com',        password: '1234', note: 'Has: consultation' },
      ],
    });

  } catch (err: unknown) {
    db.pragma('foreign_keys = ON'); // always restore
    console.error('[seed] Failed:', err);
    return NextResponse.json(
      { error: 'Seed failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
