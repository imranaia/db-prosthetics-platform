-- Migration 031: restore users profile columns dropped by mistake in 025.
--
-- Migration 025 rebuilt the `users` table (to make email/password_hash
-- nullable and add pin_hash/receptionist) but its explicit column list left
-- out 13 personal-profile columns that migration 012 had added for
-- super_admin/hospital_admin (full_name, phone, dob, gender, address,
-- state, lga, marital_status, occupation, religion, next_of_kin_*). Any
-- values already stored in those columns were silently dropped when 025's
-- rebuild ran. This restores the columns (nullable, so no rebuild needed)
-- so the app stops erroring — see the founder-facing note for whether any
-- real profile data needs manual re-entry.

ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN dob DATE;
ALTER TABLE users ADD COLUMN gender TEXT;
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN state TEXT;
ALTER TABLE users ADD COLUMN lga TEXT;
ALTER TABLE users ADD COLUMN marital_status TEXT;
ALTER TABLE users ADD COLUMN occupation TEXT;
ALTER TABLE users ADD COLUMN religion TEXT;
ALTER TABLE users ADD COLUMN next_of_kin_name TEXT;
ALTER TABLE users ADD COLUMN next_of_kin_relationship TEXT;
ALTER TABLE users ADD COLUMN next_of_kin_phone TEXT;
