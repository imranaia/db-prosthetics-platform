-- Migration 033: let a home-visit appointment be requested/assigned to a
-- P&O Specialist, not just a Doctor. Mirrors requested_doctor_id /
-- assigned_doctor_id (migrations 009, 014) — a home-visit appointment now
-- has exactly one of the doctor or po_specialist pair set, never both.

ALTER TABLE appointments ADD COLUMN requested_po_specialist_id INTEGER REFERENCES po_specialists(id);
ALTER TABLE appointments ADD COLUMN assigned_po_specialist_id INTEGER REFERENCES po_specialists(id);
