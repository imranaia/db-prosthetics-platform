-- Mirrors orders.fulfillment_status (migration 011) so custom (fabricated)
-- orders get the same dispatch -> with-doctor -> collected-by-patient
-- tracking that standard product orders already have.
-- Values: pending, confirmed, manufacturing, dispatched, delivered,
-- received_by_doctor, received_by_patient
ALTER TABLE custom_orders ADD COLUMN fulfillment_status TEXT DEFAULT 'pending';
