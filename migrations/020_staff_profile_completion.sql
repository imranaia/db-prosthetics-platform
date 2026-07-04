-- Mirrors the patient onboarding gate: staff accounts created with a temp
-- password (hospital admin, doctor, PO specialist) must complete their
-- profile before using the rest of the dashboard, not just change their
-- password.
ALTER TABLE users ADD COLUMN profile_completed_at DATETIME;
ALTER TABLE doctors ADD COLUMN profile_completed_at DATETIME;
ALTER TABLE po_specialists ADD COLUMN profile_completed_at DATETIME;
