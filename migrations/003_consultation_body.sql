-- Migration 003: Add body_parts and photos columns to consultations

ALTER TABLE consultations ADD COLUMN body_parts TEXT;
-- JSON: [{ "region": "left_hand", "label": "L. Hand", "subParts": ["Thumb","Index"] }, ...]

ALTER TABLE consultations ADD COLUMN photos TEXT;
-- JSON: [{ "type": "injury", "url": "https://..." }, { "type": "existing", "url": "https://..." }]
