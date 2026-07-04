-- in_stock is now always derived from quantity at the API layer, but
-- existing rows created before that fix may have a stale/contradictory
-- in_stock value (e.g. in_stock=1 with quantity=0) — sync them once.
UPDATE products SET in_stock = CASE WHEN quantity > 0 THEN 1 ELSE 0 END;
