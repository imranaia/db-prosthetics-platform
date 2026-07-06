-- Migration 030: Prosthetic Evaluation & Measurement form, for consultations
-- marked "fit for prosthetic" — the step the founder described as coming
-- after the fit/not-fit decision (migration 027).
--
-- Section 1 (Patient & Medical Overview) of the source document is mostly
-- already captured by the consultation (patient identity, evaluation date =
-- created_at) — only Amputation Date and Cause of Limb Loss are net-new
-- here. Section 2 (Amputation & Damage Level) duplicates the consultation's
-- own BodySelector amputation-level picker, so it isn't re-collected —
-- the measurement form just references that same consultation's body_parts.

CREATE TABLE prosthetic_measurements (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  consultation_id             INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id                  INTEGER NOT NULL REFERENCES patients(id),
  doctor_id                   INTEGER REFERENCES doctors(id),
  po_specialist_id            INTEGER REFERENCES po_specialists(id),
  conducted_by_role           TEXT NOT NULL CHECK(conducted_by_role IN ('doctor', 'po_specialist', 'super_admin')),

  -- Section 1: Medical Overview (additions beyond what consultation already has)
  amputation_date             TEXT,
  cause_of_limb_loss          TEXT CHECK(cause_of_limb_loss IN ('vascular_diabetes', 'trauma', 'cancer', 'congenital', 'other')),
  cause_other_detail          TEXT,

  -- Section 3: Residual Limb Measurements
  limb_shape_profile          TEXT CHECK(limb_shape_profile IN ('cylindrical', 'conical', 'bulbous', 'irregular')),
  residual_limb_length_cm     REAL,
  sound_limb_length_cm        REAL,
  circumference_joint_line_cm REAL,
  circumference_interval_1_cm REAL,  -- 5cm down
  circumference_interval_2_cm REAL,  -- 10cm down
  circumference_interval_3_cm REAL,  -- 15cm down
  circumference_interval_4_cm REAL,  -- 20cm down
  circumference_interval_5_cm REAL,  -- 25cm down
  circumference_interval_6_cm REAL,  -- 30cm down
  circumference_distal_end_cm REAL,
  limb_shape_drawing          TEXT,  -- freehand sketch, base64 PNG (same pattern as SignaturePad)

  -- Section 4: Functional Mobility Assessment
  k_level                     TEXT CHECK(k_level IN ('k0', 'k1', 'k2', 'k3', 'k4')),

  -- Section 5: Lifestyle Goals & Field Notes
  lifestyle_goals             TEXT,
  field_notes                 TEXT,
  clinician_name               TEXT,
  clinician_signature          TEXT,

  created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurements_consultation ON prosthetic_measurements(consultation_id);
