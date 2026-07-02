-- Extended profile fields for all roles

-- Users table: personal info for super_admin and hospital_admin
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

-- P&O Specialists: full personal + professional profile
ALTER TABLE po_specialists ADD COLUMN full_name TEXT;
ALTER TABLE po_specialists ADD COLUMN phone TEXT;
ALTER TABLE po_specialists ADD COLUMN specialization TEXT;
ALTER TABLE po_specialists ADD COLUMN years_experience INTEGER;
ALTER TABLE po_specialists ADD COLUMN qualifications TEXT;
ALTER TABLE po_specialists ADD COLUMN state TEXT;
ALTER TABLE po_specialists ADD COLUMN lga TEXT;
ALTER TABLE po_specialists ADD COLUMN address TEXT;
ALTER TABLE po_specialists ADD COLUMN dob DATE;
ALTER TABLE po_specialists ADD COLUMN gender TEXT;
ALTER TABLE po_specialists ADD COLUMN marital_status TEXT;
ALTER TABLE po_specialists ADD COLUMN occupation TEXT;
ALTER TABLE po_specialists ADD COLUMN religion TEXT;
ALTER TABLE po_specialists ADD COLUMN next_of_kin_name TEXT;
ALTER TABLE po_specialists ADD COLUMN next_of_kin_relationship TEXT;
ALTER TABLE po_specialists ADD COLUMN next_of_kin_phone TEXT;

-- Doctors: personal info (professional fields already added in 009)
ALTER TABLE doctors ADD COLUMN dob DATE;
ALTER TABLE doctors ADD COLUMN gender TEXT;
ALTER TABLE doctors ADD COLUMN marital_status TEXT;
ALTER TABLE doctors ADD COLUMN occupation TEXT;
ALTER TABLE doctors ADD COLUMN religion TEXT;
ALTER TABLE doctors ADD COLUMN next_of_kin_name TEXT;
ALTER TABLE doctors ADD COLUMN next_of_kin_relationship TEXT;
ALTER TABLE doctors ADD COLUMN next_of_kin_phone TEXT;

-- Custom orders: categorized photo uploads
ALTER TABLE custom_orders ADD COLUMN photos_affected TEXT;     -- JSON array: photos of affected limb/part
ALTER TABLE custom_orders ADD COLUMN photos_unaffected TEXT;  -- JSON array: photos of healthy reference limb
