-- Migration 034: track profit, not just revenue.
--
-- products.price is the sale price; there was previously no way to record
-- what a product actually cost DB Prosthetics to acquire/make, so the
-- dashboard could only ever show gross device revenue, never profit.
-- Nullable — profit reporting only covers products where this has been
-- filled in; existing products start with no cost price on record.
ALTER TABLE products ADD COLUMN cost_price INTEGER;
