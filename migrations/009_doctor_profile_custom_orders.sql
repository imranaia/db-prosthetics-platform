-- Doctor profile fields
ALTER TABLE doctors ADD COLUMN full_name TEXT;
ALTER TABLE doctors ADD COLUMN phone TEXT;
ALTER TABLE doctors ADD COLUMN specialization TEXT;
ALTER TABLE doctors ADD COLUMN state TEXT;
ALTER TABLE doctors ADD COLUMN lga TEXT;
ALTER TABLE doctors ADD COLUMN address TEXT;
ALTER TABLE doctors ADD COLUMN years_experience INTEGER;
ALTER TABLE doctors ADD COLUMN qualifications TEXT;

-- Custom/bespoke prosthetic orders
CREATE TABLE IF NOT EXISTS custom_orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id        INTEGER REFERENCES patients(id),
  doctor_id         INTEGER REFERENCES doctors(id),
  po_specialist_id  INTEGER REFERENCES po_specialists(id),
  created_by_role   TEXT NOT NULL CHECK(created_by_role IN ('patient','doctor','po_specialist')),
  category          TEXT CHECK(category IN ('upper_limb','lower_limb','facial','spinal','other')),
  description       TEXT NOT NULL,
  photos            TEXT,   -- JSON array of Cloudinary URLs
  status            TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','quoted','accepted','rejected','paid','fulfilled','cancelled')),
  quoted_price      INTEGER,   -- kobo, set by admin after review
  payment_target    TEXT NOT NULL DEFAULT 'creator' CHECK(payment_target IN ('creator','patient')),
  payment_status    TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid')),
  paystack_ref      TEXT,
  admin_notes       TEXT,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Doctor assignment for home visit appointments
ALTER TABLE appointments ADD COLUMN assigned_doctor_id INTEGER REFERENCES doctors(id);

-- Orders: track who placed the order and allow sending to patient for payment
ALTER TABLE orders ADD COLUMN created_by_id INTEGER;
ALTER TABLE orders ADD COLUMN payment_target TEXT NOT NULL DEFAULT 'creator' CHECK(payment_target IN ('creator','patient'));
