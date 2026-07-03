-- consent_forms was created tonight with conducted_by_role restricted to
-- ('super_admin','doctor') for a standalone creation page. Consent is now
-- captured inline by whoever places a fabrication order — which can also
-- be a po_specialist or the patient themselves — so the role list needs
-- widening. The table has no real rows yet (only throwaway test data,
-- already deleted), so a clean rebuild is safe.
DROP TABLE IF EXISTS consent_forms;

CREATE TABLE consent_forms (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id                  INTEGER NOT NULL REFERENCES patients(id),
  consultation_id             INTEGER REFERENCES consultations(id),
  hospital_id                 INTEGER REFERENCES hospitals(id),
  order_id                    INTEGER REFERENCES orders(id),
  custom_order_id             INTEGER REFERENCES custom_orders(id),
  patient_display_id          TEXT,
  form_date                   DATE NOT NULL,
  patient_guardian_name       TEXT,
  patient_guardian_signature  TEXT,
  witness_name                TEXT,
  witness_signature           TEXT,
  clinician_name               TEXT,
  clinician_signature          TEXT,
  conducted_by_role           TEXT NOT NULL CHECK(conducted_by_role IN ('super_admin', 'doctor', 'po_specialist', 'patient')),
  created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP
);
