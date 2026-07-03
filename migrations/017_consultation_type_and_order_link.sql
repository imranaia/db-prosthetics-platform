-- Distinguish a quick follow-up visit from one that assesses a patient for
-- a new prosthetic, and let the recommended device carry a real category
-- (matching custom_orders.category) instead of free text alone.
ALTER TABLE consultations ADD COLUMN consultation_type TEXT NOT NULL DEFAULT 'new' CHECK(consultation_type IN ('new', 'follow_up'));
ALTER TABLE consultations ADD COLUMN category TEXT CHECK(category IN ('upper_limb', 'lower_limb', 'facial', 'spinal', 'other'));

-- Traceability: an order placed as the direct outcome of a consultation
-- (the "recommend a new device" handoff) links back to it.
ALTER TABLE custom_orders ADD COLUMN consultation_id INTEGER REFERENCES consultations(id);
ALTER TABLE orders ADD COLUMN consultation_id INTEGER REFERENCES consultations(id);
