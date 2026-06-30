-- DB Prosthetics and Orthotics Ltd
-- Initial Schema — Migration 001
-- Money values are stored in KOBO (₦1 = 100 kobo) to avoid floating-point rounding bugs.
-- e.g. ₦1,000 service fee = 100000 kobo

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────
-- USERS (all roles share one table)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    UNIQUE NOT NULL,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK(role IN (
                  'super_admin',
                  'hospital_admin',
                  'doctor',
                  'po_specialist',
                  'patient'
                )),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- HOSPITALS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  state         TEXT    NOT NULL,
  address       TEXT,
  admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- DOCTORS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- P&O SPECIALISTS
-- hospital_id is NULLABLE — NULL means independent (not hospital-linked)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS po_specialists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- PATIENTS
-- user_id is NULLABLE — a patient registered by a doctor/admin
-- may not have a portal account at all
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  full_name   TEXT    NOT NULL,
  phone       TEXT,
  dob         DATE,
  address     TEXT,
  state       TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- TEAM MEMBERS (landing page — editable by Super Admin)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  position      TEXT    NOT NULL,
  photo_url     TEXT,
  bio           TEXT,
  display_order INTEGER DEFAULT 0,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- PRODUCTS
-- price stored in kobo
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  category    TEXT    NOT NULL CHECK(category IN (
                'upper_limb',
                'lower_limb',
                'facial',
                'spinal'
              )),
  type        TEXT    NOT NULL CHECK(type IN ('complete', 'part')),
  price       INTEGER NOT NULL,  -- in kobo
  description TEXT,
  image_url   TEXT,
  in_stock    INTEGER NOT NULL DEFAULT 1,  -- 1 = available, 0 = out of stock
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- BODY ASSESSMENTS
-- photos stored as a JSON array of Cloudinary URLs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_assessments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  body_part       TEXT    NOT NULL,
  limb_extent     TEXT,
  height_cm       REAL,
  weight_kg       REAL,
  photos          TEXT,   -- JSON array: ["https://...", "https://..."]
  notes           TEXT,
  created_by_role TEXT    NOT NULL CHECK(created_by_role IN (
                    'super_admin', 'doctor', 'patient'
                  )),
  created_by_id   INTEGER NOT NULL,  -- user_id of whoever filled this in
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- ORDERS
-- total_amount and service_fee stored in kobo
-- service_fee is ALWAYS 100000 (₦1,000) — hardcoded server-side
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id       INTEGER NOT NULL REFERENCES patients(id),
  hospital_id      INTEGER REFERENCES hospitals(id),
  doctor_id        INTEGER REFERENCES doctors(id),
  po_specialist_id INTEGER REFERENCES po_specialists(id),
  created_by_role  TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN (
                     'pending', 'processing', 'fulfilled', 'cancelled'
                   )),
  total_amount     INTEGER NOT NULL,  -- product total + service_fee, in kobo
  service_fee      INTEGER NOT NULL DEFAULT 100000,  -- always ₦1,000 = 100000 kobo
  payment_method   TEXT    CHECK(payment_method IN ('cash', 'transfer', 'paystack')),
  payment_status   TEXT    NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN (
                     'unpaid', 'paid'
                   )),
  paystack_ref     TEXT,   -- Paystack transaction reference, if applicable
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- price_at_order is a snapshot of the product price at the time of ordering
-- (products can change price later — this preserves history)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     INTEGER NOT NULL REFERENCES products(id),
  quantity       INTEGER NOT NULL DEFAULT 1,
  price_at_order INTEGER NOT NULL  -- in kobo
);

-- ─────────────────────────────────────────────
-- APPOINTMENTS
-- quoted_price in kobo (nullable — only set for home visits by Super Admin)
-- service_fee in kobo (₦1,000 = 100000, applied when invoice is paid)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id           INTEGER NOT NULL REFERENCES patients(id),
  type                 TEXT    NOT NULL CHECK(type IN ('home', 'hospital')),
  status               TEXT    NOT NULL DEFAULT 'requested' CHECK(status IN (
                         'requested',   -- patient submitted
                         'quoted',      -- super admin set a price (home only)
                         'confirmed',   -- payment received / hospital assigned
                         'completed',
                         'cancelled'
                       )),
  assigned_hospital_id INTEGER REFERENCES hospitals(id),
  quoted_price         INTEGER,  -- kobo, only for home visits
  service_fee          INTEGER   DEFAULT 100000,  -- kobo
  payment_status       TEXT      NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN (
                         'unpaid', 'paid', 'not_required'
                       )),
  paystack_ref         TEXT,
  scheduled_date       DATETIME,
  notes                TEXT,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- CONSULTATIONS
-- The joining record that links a patient's full history together:
-- one consultation → one body assessment + one order
-- doctor_id is NULL when Super Admin conducts the consultation
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultations (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id         INTEGER NOT NULL REFERENCES patients(id),
  doctor_id          INTEGER REFERENCES doctors(id),  -- NULL = super admin
  conducted_by_role  TEXT    NOT NULL CHECK(conducted_by_role IN (
                       'super_admin', 'doctor'
                     )),
  notes              TEXT,
  body_assessment_id INTEGER REFERENCES body_assessments(id),
  order_id           INTEGER REFERENCES orders(id),
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);
