-- Patients can no longer submit a brand-new custom/fabrication order from
-- scratch — every new order has to go through a doctor, P&O specialist, or
-- super admin. Instead, patients can request a reorder/replacement of a
-- device they already have (broken, outgrown, etc.), which reuses the
-- existing custom_orders review/quote/fulfill flow.
ALTER TABLE custom_orders ADD COLUMN reorder_of_order_id INTEGER REFERENCES orders(id);
ALTER TABLE custom_orders ADD COLUMN reorder_of_custom_order_id INTEGER REFERENCES custom_orders(id);
ALTER TABLE custom_orders ADD COLUMN reorder_reason TEXT;
