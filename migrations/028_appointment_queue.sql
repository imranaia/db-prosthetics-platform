-- Migration 028: first-come-first-served queue for hospital appointments.
--
-- The queue order itself is just the existing (scheduled_date, created_at)
-- ordering — nothing new needed there. What's new is tracking whether a
-- patient has physically checked in (receptionist's "Patient is here"
-- button) and whether the doctor has skipped them (with a reason), which
-- lets a skipped patient fall out of "current" without losing their place —
-- unskipping (via check-in) simply makes them eligible to be "current" again
-- in their original position.

ALTER TABLE appointments ADD COLUMN patient_checked_in INTEGER NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN queue_skipped INTEGER NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN queue_skip_reason TEXT;
