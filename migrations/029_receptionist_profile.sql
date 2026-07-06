-- Migration 029: Give Receptionist a full personal profile, matching the
-- doctor/P&O Specialist "complete your profile" pattern (full_name/phone
-- already exist on receptionists from migration 025).

ALTER TABLE receptionists ADD COLUMN state TEXT;
ALTER TABLE receptionists ADD COLUMN lga TEXT;
ALTER TABLE receptionists ADD COLUMN address TEXT;
ALTER TABLE receptionists ADD COLUMN dob DATE;
ALTER TABLE receptionists ADD COLUMN gender TEXT;
ALTER TABLE receptionists ADD COLUMN marital_status TEXT;
ALTER TABLE receptionists ADD COLUMN occupation TEXT;
ALTER TABLE receptionists ADD COLUMN religion TEXT;
ALTER TABLE receptionists ADD COLUMN next_of_kin_name TEXT;
ALTER TABLE receptionists ADD COLUMN next_of_kin_relationship TEXT;
ALTER TABLE receptionists ADD COLUMN next_of_kin_phone TEXT;
ALTER TABLE receptionists ADD COLUMN profile_completed_at DATETIME;
