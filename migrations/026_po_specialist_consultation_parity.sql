-- Migration 026: Let P&O Specialists conduct consultations, same as Doctors.
--
-- consultations.doctor_id is a strict FK to doctors(id), so a P&O Specialist's
-- own id (from the separate po_specialists table) can't be stored there.
-- Add a parallel po_specialist_id column and widen the conducted_by_role
-- CHECK (SQLite has no ALTER COLUMN, so recreate the table, same pattern as
-- migrations 013/025).

CREATE TABLE consultations_new (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id         INTEGER NOT NULL REFERENCES patients(id),
  doctor_id          INTEGER REFERENCES doctors(id),
  po_specialist_id   INTEGER REFERENCES po_specialists(id),
  conducted_by_role  TEXT    NOT NULL CHECK(conducted_by_role IN (
                       'super_admin', 'doctor', 'po_specialist'
                     )),
  notes              TEXT,
  body_assessment_id INTEGER REFERENCES body_assessments(id),
  order_id           INTEGER REFERENCES orders(id),
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  body_parts         TEXT,
  photos             TEXT,
  hospital_id        INTEGER REFERENCES hospitals(id),
  assessor_name      TEXT,
  chief_complaint    TEXT,
  medical_history    TEXT,
  physical_assessment TEXT,
  patient_goals      TEXT,
  recommended_device TEXT,
  followup_date      TEXT,
  consent_given      INTEGER DEFAULT 0,
  assessor_signature TEXT,
  patient_signature  TEXT,
  consultation_type  TEXT NOT NULL DEFAULT 'new',
  category           TEXT
);

INSERT INTO consultations_new (
  id, patient_id, doctor_id, conducted_by_role, notes,
  body_assessment_id, order_id, created_at, body_parts, photos,
  hospital_id, assessor_name, chief_complaint, medical_history,
  physical_assessment, patient_goals, recommended_device, followup_date,
  consent_given, assessor_signature, patient_signature, consultation_type, category
)
SELECT
  id, patient_id, doctor_id, conducted_by_role, notes,
  body_assessment_id, order_id, created_at, body_parts, photos,
  hospital_id, assessor_name, chief_complaint, medical_history,
  physical_assessment, patient_goals, recommended_device, followup_date,
  consent_given, assessor_signature, patient_signature, consultation_type, category
FROM consultations;

DROP TABLE consultations;
ALTER TABLE consultations_new RENAME TO consultations;
