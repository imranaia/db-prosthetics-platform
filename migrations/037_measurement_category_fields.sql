-- Migration 037: category-specific measurement fields, extracted from the
-- 12 ISPO-style technical cards in docs/ (AFO, Ankle/Hip/Knee
-- Disarticulation, Ortho-Prosthesis, Partial Foot, Spine Orthosis,
-- Transfemoral, Transhumeral, Transradial, Transtibial, Upper Limb
-- Orthosis). Grouped by the three Device Category buckets the founder
-- asked for (Upper Limb / Lower Limb / Trunk), plus two lower-limb
-- sub-sections (Partial Foot, AFO) that have their own distinct fields on
-- their respective cards rather than fitting the general limb pattern.

ALTER TABLE prosthetic_measurements ADD COLUMN footwear_type TEXT CHECK(footwear_type IN ('barefoot', 'closed_shoe', 'flip_flop', 'open_shoe'));
ALTER TABLE prosthetic_measurements ADD COLUMN heel_height_cm REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN socket_ap_width_cm REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN socket_ml_width_cm REAL;

-- Partial Foot card: amputation level + foot length/width (Chopart/Lisfranc/
-- Trans-Metatarsal lines on the technical card's foot diagram).
ALTER TABLE prosthetic_measurements ADD COLUMN partial_foot_level TEXT CHECK(partial_foot_level IN ('chopart', 'lisfranc', 'trans_metatarsal'));
ALTER TABLE prosthetic_measurements ADD COLUMN foot_length_cm REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN foot_width_cm REAL;

-- AFO/FO card: ankle joint hardware + function + shoe modification.
ALTER TABLE prosthetic_measurements ADD COLUMN afo_ankle_joint_type TEXT CHECK(afo_ankle_joint_type IN ('free_motion_scotty', 'free_motion_oklahoma', 'ankle_flexure_tamarack', 'stirrup'));
ALTER TABLE prosthetic_measurements ADD COLUMN afo_ankle_joint_other TEXT;
ALTER TABLE prosthetic_measurements ADD COLUMN afo_functions TEXT; -- comma-separated, multi-select (Plantar Flexion Stop, Limited Motion, Dorsiflexion Assist, Double Assist, Rigid, Free Motion)
ALTER TABLE prosthetic_measurements ADD COLUMN shoe_modification TEXT;

-- Upper limb cards (Transhumeral/Transradial/Upper Limb Orthosis): segment
-- lengths down the arm + AP/ML width, mirroring the lower-limb socket width
-- fields above.
ALTER TABLE prosthetic_measurements ADD COLUMN segment_length_proximal_cm REAL; -- shoulder/socket to elbow
ALTER TABLE prosthetic_measurements ADD COLUMN segment_length_distal_cm REAL;   -- elbow to wrist
ALTER TABLE prosthetic_measurements ADD COLUMN segment_length_terminal_cm REAL; -- wrist to fingertip
ALTER TABLE prosthetic_measurements ADD COLUMN limb_ap_width_cm REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN limb_ml_width_cm REAL;

-- Trunk/Spinal card: circumferences at 4 levels (underarm/chest, waist,
-- upper hip, hip), matching the 4 circle+box pairs on the back-view diagram.
ALTER TABLE prosthetic_measurements ADD COLUMN trunk_circumference_1_cm REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN trunk_circumference_2_cm REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN trunk_circumference_3_cm REAL;
ALTER TABLE prosthetic_measurements ADD COLUMN trunk_circumference_4_cm REAL;
