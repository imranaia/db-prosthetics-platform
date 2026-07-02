CREATE TABLE IF NOT EXISTS discharge_forms (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  consultation_id        INTEGER REFERENCES consultations(id) ON DELETE SET NULL,
  patient_id             INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id            INTEGER REFERENCES hospitals(id),
  -- Post-fitting assessment (status/notes per aspect)
  device_fit             TEXT,
  alignment_function     TEXT,
  skin_condition         TEXT,
  pain_discomfort        TEXT,
  gait_mobility          TEXT,
  patient_satisfaction   TEXT,
  -- Training provided (1=yes, 0=no)
  training_donning       INTEGER DEFAULT 0,
  training_care          INTEGER DEFAULT 0,
  training_skin          INTEGER DEFAULT 0,
  training_troubleshooting INTEGER DEFAULT 0,
  -- Discharge summary
  discharge_date         TEXT,
  discharge_reason       TEXT,
  followup_recommended   INTEGER DEFAULT 0,
  next_appointment       TEXT,
  -- Signatures
  prosthetist_name       TEXT,
  patient_signature_name TEXT,
  conducted_by_role      TEXT NOT NULL DEFAULT 'super_admin',
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP
);
