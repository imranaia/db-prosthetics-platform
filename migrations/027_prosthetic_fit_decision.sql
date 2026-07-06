-- Migration 027: end-of-consultation fit-for-prosthetic decision.
--
-- fit_for_prosthetic is NULL until the practitioner records a decision.
-- 'not_fit' branches into a diagnosis/next-steps/treatment record as the
-- final outcome for that patient. 'fit' proceeds toward a measurement form
-- (fields to be defined later — not built yet, so nothing to store for it
-- here beyond the decision itself).

ALTER TABLE consultations ADD COLUMN fit_for_prosthetic TEXT CHECK(fit_for_prosthetic IN ('fit', 'not_fit'));
ALTER TABLE consultations ADD COLUMN unfit_diagnosis TEXT;
ALTER TABLE consultations ADD COLUMN unfit_next_steps TEXT;
ALTER TABLE consultations ADD COLUMN unfit_treatment TEXT;
