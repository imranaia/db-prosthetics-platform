-- Consent is no longer captured on its own standalone page — it's
-- captured inline at the moment an order for a prosthetic device is
-- placed. Link each consent record to whichever order produced it.
ALTER TABLE consent_forms ADD COLUMN order_id INTEGER REFERENCES orders(id);
ALTER TABLE consent_forms ADD COLUMN custom_order_id INTEGER REFERENCES custom_orders(id);
