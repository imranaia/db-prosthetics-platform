-- Patient Bio-Data Form's "Declaration & Consent": the patient attests
-- their own data is accurate and consents to its use, signed once at
-- onboarding (before a clinician has necessarily seen them).
ALTER TABLE patients ADD COLUMN declaration_signature TEXT;
ALTER TABLE patients ADD COLUMN declaration_signed_at DATETIME;
