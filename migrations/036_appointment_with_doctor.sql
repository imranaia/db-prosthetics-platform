-- The queue only tracked "checked in" (reception) and "skipped" (doctor
-- passed on them for now). There was no state for "the doctor has actually
-- called this patient in and is seeing them right now" — clicking the
-- doctor's queue button jumped straight to status='completed', so the
-- button never had anything to disable into, and patients/reception had no
-- way to see "you're with the doctor" instead of just "confirmed".
ALTER TABLE appointments ADD COLUMN with_doctor INTEGER NOT NULL DEFAULT 0;
