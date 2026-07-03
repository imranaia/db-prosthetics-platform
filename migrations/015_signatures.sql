-- Digital signature capture — signatures are drawn on-device and stored as
-- base64 PNG data URLs (TEXT), the same pattern already used for photo URLs
-- elsewhere in this schema.

-- Standard Assessment Form: Prosthetist/Orthotist + Patient/Guardian signature
ALTER TABLE consultations ADD COLUMN assessor_signature TEXT;
ALTER TABLE consultations ADD COLUMN patient_signature TEXT;

-- Post-Fitting Discharge Form: upgrade the typed-name-only signature fields
-- with an actual drawn signature. prosthetist_name / patient_signature_name
-- remain as the printed name that accompanies each signature.
ALTER TABLE discharge_forms ADD COLUMN prosthetist_signature TEXT;
ALTER TABLE discharge_forms ADD COLUMN patient_signature TEXT;

-- ─────────────────────────────────────────────
-- CONSENT FORMS
-- "Consent Form for Fabrication and Fitting of Artificial Limbs" — a
-- standalone legal document, distinct from the consent_given checkbox
-- captured during a consultation.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_forms (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id                  INTEGER NOT NULL REFERENCES patients(id),
  consultation_id             INTEGER REFERENCES consultations(id),
  hospital_id                 INTEGER REFERENCES hospitals(id),
  patient_display_id          TEXT,
  form_date                   DATE NOT NULL,
  patient_guardian_name       TEXT,
  patient_guardian_signature  TEXT,
  witness_name                TEXT,
  witness_signature           TEXT,
  clinician_name               TEXT,
  clinician_signature          TEXT,
  conducted_by_role           TEXT NOT NULL CHECK(conducted_by_role IN ('super_admin', 'doctor')),
  created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP
);
