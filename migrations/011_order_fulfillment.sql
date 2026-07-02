-- Super admin can self-assign to home visits
ALTER TABLE appointments ADD COLUMN assigned_to_admin INTEGER DEFAULT 0;

-- Product quantity tracking
ALTER TABLE products ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0;

-- Extended order statuses for fulfilment tracking
-- Note: SQLite CHECK constraints can't be altered, so we handle validation in code
ALTER TABLE orders ADD COLUMN fulfillment_status TEXT DEFAULT 'pending';
-- fulfillment_status values: pending, confirmed, manufacturing, dispatched, delivered, received_by_doctor, received_by_patient
-- Also on orders:
ALTER TABLE orders ADD COLUMN fulfillment_notes TEXT;
ALTER TABLE orders ADD COLUMN dispatched_at TEXT;
ALTER TABLE orders ADD COLUMN delivered_at TEXT;
