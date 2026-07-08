-- Migration 038: joint range-of-motion fields, found on re-reading the
-- remaining lower-limb technical cards (Ankle Disarticulation, Knee
-- Disarticulation, Transfemoral, Transtibial all have a Flexion/Extension/
-- Abduction/Adduction block for the joint proximal to the amputation
-- level). Hip Disarticulation, Partial Foot, and AFO don't have this block
-- (no proximal joint remains, or it's foot-level), so it's optional.
ALTER TABLE prosthetic_measurements ADD COLUMN rom_flexion_deg REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN rom_extension_deg REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN rom_abduction_deg REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN rom_adduction_deg REAL;
