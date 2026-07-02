-- Materials catalogue (admin-managed)
CREATE TABLE IF NOT EXISTS materials (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  in_stock    INTEGER NOT NULL DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extend products with image, dimensions, material
ALTER TABLE products ADD COLUMN image_url  TEXT;
ALTER TABLE products ADD COLUMN dimensions TEXT;
ALTER TABLE products ADD COLUMN material   TEXT;

-- Custom orders: requested material + body parts (JSON)
ALTER TABLE custom_orders ADD COLUMN material_id INTEGER REFERENCES materials(id);
ALTER TABLE custom_orders ADD COLUMN body_parts  TEXT;   -- JSON array from BodySelector
