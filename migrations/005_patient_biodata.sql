-- Migration 005: Add patient bio-data fields

ALTER TABLE patients ADD COLUMN gender TEXT;
ALTER TABLE patients ADD COLUMN marital_status TEXT;
ALTER TABLE patients ADD COLUMN religion TEXT;
ALTER TABLE patients ADD COLUMN lga TEXT;
ALTER TABLE patients ADD COLUMN occupation TEXT;
ALTER TABLE patients ADD COLUMN next_of_kin_name TEXT;
ALTER TABLE patients ADD COLUMN next_of_kin_relationship TEXT;
ALTER TABLE patients ADD COLUMN next_of_kin_phone TEXT;
ALTER TABLE patients ADD COLUMN referral_source TEXT;
ALTER TABLE patients ADD COLUMN amputation_yes INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN amputation_level TEXT;
ALTER TABLE patients ADD COLUMN amputation_side TEXT;
ALTER TABLE patients ADD COLUMN amputation_date TEXT;
ALTER TABLE patients ADD COLUMN amputation_cause TEXT;
ALTER TABLE patients ADD COLUMN previous_prosthesis TEXT;
ALTER TABLE patients ADD COLUMN allergies TEXT;
ALTER TABLE patients ADD COLUMN functional_mobility_status TEXT;
ALTER TABLE patients ADD COLUMN caregiver_info TEXT;
