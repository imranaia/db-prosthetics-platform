-- Appointment scheduling fields
-- preferred_date was already read/written by app code but never added to the
-- schema, so every patient appointment booking failed with a SQL error.
ALTER TABLE appointments ADD COLUMN preferred_date DATE;

-- Patient's own doctor choice for a home visit (NULL = no preference,
-- Super Admin decides). Distinct from assigned_doctor_id, which is the
-- Super Admin's final decision.
ALTER TABLE appointments ADD COLUMN requested_doctor_id INTEGER REFERENCES doctors(id);
