-- Migration 032: restore users.profile_completed_at, also dropped by 025's
-- table rebuild (migration 020 had added it) — missed in 031's fix because
-- I checked migration 012's column list but not 020's.

ALTER TABLE users ADD COLUMN profile_completed_at DATETIME;
