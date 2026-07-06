-- Migration 025: Patient unique ID (for patients with no email) + Receptionist role
--
-- Many patients in Nigeria have no email address. Every patient now gets a
-- unique ID they can use to log in (with a PIN instead of a password) and
-- that staff can search/track by. Patients with an email keep that as a
-- bonus channel, not a requirement.
--
-- Receptionists register these patients in person and are a new per-hospital
-- staff role, created by that hospital's Hospital Admin (mirrors doctors/
-- po_specialists).

-- users.email and users.password_hash must become nullable (ID+PIN accounts
-- have neither), and the role CHECK needs 'receptionist' added. SQLite has
-- no ALTER COLUMN, so recreate the table (same pattern as migration 013).
CREATE TABLE users_new (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  email                 TEXT    UNIQUE,
  password_hash         TEXT,
  pin_hash              TEXT,
  role                  TEXT    NOT NULL CHECK(role IN (
                          'super_admin',
                          'hospital_admin',
                          'doctor',
                          'po_specialist',
                          'patient',
                          'receptionist'
                        )),
  must_change_password  INTEGER DEFAULT 0,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_at             TEXT,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new (
  id, email, password_hash, role, must_change_password,
  failed_login_attempts, locked_at, created_at
)
SELECT
  id, email, password_hash, role, must_change_password,
  failed_login_attempts, locked_at, created_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- patient_unique_id: a human-friendly ID (e.g. DBP-00001) generated from the
-- patient's own row id once inserted. Nullable only until the app backfills
-- existing rows; every new patient gets one going forward.
ALTER TABLE patients ADD COLUMN patient_unique_id TEXT;
CREATE UNIQUE INDEX idx_patients_unique_id ON patients(patient_unique_id);

-- Which hospital originally registered this patient (set only when a
-- receptionist/hospital admin adds them in person). Purely informational —
-- patients are never restricted to booking at this hospital.
ALTER TABLE patients ADD COLUMN registering_hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS receptionists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT
);

-- Backfill existing patients with a unique ID so search/tracking works for
-- everyone immediately, not just new signups.
UPDATE patients SET patient_unique_id = printf('DBP-%05d', id) WHERE patient_unique_id IS NULL;
