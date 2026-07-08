-- Migration 039: exact device sub-type within a Device Category, so the
-- clinician picks the precise technical card (e.g. "Transfemoral" rather
-- than just "Lower Limb") and the measurement form shows only the fields
-- that card actually has, instead of the shared per-category bucket.
ALTER TABLE consultations ADD COLUMN device_subtype TEXT;
