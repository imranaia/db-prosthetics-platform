-- Site content: editable landing page sections stored as key/value JSON
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_content (key, value) VALUES
  ('hero_badge',        'Certified Prosthetics & Orthotics · Nigeria'),
  ('hero_heading',      'Restoring Movement. Rebuilding Lives.'),
  ('hero_subheading',   'DB Prosthetics and Orthotics Ltd delivers precision prosthetic and orthotic solutions across Nigeria, connecting hospitals, specialists, and patients in one seamless system.'),
  ('hero_cta_primary',  'Book a Consultation'),
  ('hero_cta_secondary','For Healthcare Providers'),
  ('hero_image_url',    ''),
  ('services', '[{"title":"Custom Prosthetics","description":"Precision-fitted upper and lower limb prostheses — from complete limb solutions to partial replacements — crafted to restore natural movement."},{"title":"Orthotic Devices","description":"Custom spinal, facial, and limb orthoses designed to support, correct, and protect — built around each patient''s unique anatomy."},{"title":"Hospital & Home Visits","description":"Consultations at your partnered hospital or, for complex cases, a specialist visit directly to the patient — fully managed through our platform."}]'),
  ('portfolio', '[{"cat":"Lower Limb","label":"Below-Knee Prosthesis","sub":"Transtibial fitting, adult male","image_url":""},{"cat":"Upper Limb","label":"Transradial Prosthesis","sub":"Below-elbow myoelectric","image_url":""},{"cat":"Lower Limb","label":"Above-Knee Prosthesis","sub":"Transfemoral fitting, paediatric","image_url":""},{"cat":"Spinal","label":"TLSO Brace","sub":"Thoracolumbar support","image_url":""},{"cat":"Upper Limb","label":"Shoulder Disarticulation","sub":"Body-powered prosthesis","image_url":""},{"cat":"Facial","label":"Auricular Prosthesis","sub":"Custom-moulded ear prosthetic","image_url":""}]'),
  ('cta_heading',  'Ready to Begin Your Journey?'),
  ('cta_subtext',  'Book a consultation — at a partnered hospital near you, or request a specialist home visit.');
