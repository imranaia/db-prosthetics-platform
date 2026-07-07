-- Migration 035: correct product stock/quantity that was never decremented
-- by past orders.
--
-- Placing an order (app/api/orders POST) checked in_stock but never actually
-- reserved the units, so "Potential Income" (sum of price for in_stock
-- products) kept counting inventory that had already been sold — it never
-- shrank as orders came in. This is a one-time correction for orders placed
-- before that was fixed; every order from now on decrements stock at
-- creation time and restores it if cancelled.
--
-- Cancelled orders never actually consumed stock, so they're excluded here.
UPDATE products
SET quantity = MAX(
  COALESCE(quantity, 0) - COALESCE((
    SELECT SUM(oi.quantity)
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = products.id AND o.status != 'cancelled'
  ), 0),
  0
)
WHERE id IN (SELECT DISTINCT product_id FROM order_items);

UPDATE products SET in_stock = 0 WHERE quantity <= 0;
