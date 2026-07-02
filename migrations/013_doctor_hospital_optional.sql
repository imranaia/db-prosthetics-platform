-- doctors.hospital_id becomes NULLABLE — NULL means personal/independent
-- (not tied to a hospital), matching the po_specialists pattern. Hospital
-- attribution moves to being picked per-consultation instead of fixed on
-- the doctor record. SQLite has no ALTER COLUMN, so recreate the table.

CREATE TABLE doctors_new (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id               INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
  full_name                 TEXT,
  phone                     TEXT,
  specialization            TEXT,
  state                     TEXT,
  lga                       TEXT,
  address                   TEXT,
  years_experience          INTEGER,
  qualifications            TEXT,
  dob                       DATE,
  gender                    TEXT,
  marital_status            TEXT,
  occupation                TEXT,
  religion                  TEXT,
  next_of_kin_name          TEXT,
  next_of_kin_relationship  TEXT,
  next_of_kin_phone         TEXT
);

INSERT INTO doctors_new (
  id, user_id, hospital_id, full_name, phone, specialization, state, lga, address,
  years_experience, qualifications, dob, gender, marital_status, occupation, religion,
  next_of_kin_name, next_of_kin_relationship, next_of_kin_phone
)
SELECT
  id, user_id, hospital_id, full_name, phone, specialization, state, lga, address,
  years_experience, qualifications, dob, gender, marital_status, occupation, religion,
  next_of_kin_name, next_of_kin_relationship, next_of_kin_phone
FROM doctors;

DROP TABLE doctors;
ALTER TABLE doctors_new RENAME TO doctors;
