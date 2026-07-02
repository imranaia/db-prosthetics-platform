-- Migration 004: Expand consultations with full Standard Assessment Form fields

ALTER TABLE consultations ADD COLUMN hospital_id INTEGER REFERENCES hospitals(id);
ALTER TABLE consultations ADD COLUMN assessor_name TEXT;
ALTER TABLE consultations ADD COLUMN chief_complaint TEXT;
ALTER TABLE consultations ADD COLUMN medical_history TEXT;
ALTER TABLE consultations ADD COLUMN physical_assessment TEXT; -- JSON
ALTER TABLE consultations ADD COLUMN patient_goals TEXT;
ALTER TABLE consultations ADD COLUMN recommended_device TEXT;
ALTER TABLE consultations ADD COLUMN followup_date TEXT;
ALTER TABLE consultations ADD COLUMN consent_given INTEGER DEFAULT 0;
