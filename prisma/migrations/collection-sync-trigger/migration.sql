-- Function to sync collections to orders table
CREATE OR REPLACE FUNCTION sync_collection_to_order()
RETURNS TRIGGER AS $$
DECLARE
  total_collected DECIMAL(12, 2);
  order_total DECIMAL(12, 2);
  new_balance DECIMAL(12, 2);
BEGIN
  -- Get the order's total amount
  SELECT total_amount INTO order_total
  FROM orders
  WHERE id = NEW.order_id;

  -- Calculate total amount collected for this order
  SELECT COALESCE(SUM(amount_collected), 0) INTO total_collected
  FROM collections
  WHERE order_id = NEW.order_id;

  -- Calculate new balance
  new_balance := order_total - total_collected;

  -- Update the order with collection info
  UPDATE orders
  SET
    amount_paid = total_collected,
    balance = new_balance,
    collection_completed_at = CASE
      WHEN new_balance <= 0 THEN NEW.created_at
      ELSE collection_completed_at
    END,
    status = CASE
      WHEN new_balance <= 0 THEN 'COLLECTED'
      ELSE status
    END
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on collections
DROP TRIGGER IF EXISTS sync_collection_to_order_trigger ON collections;
CREATE TRIGGER sync_collection_to_order_trigger
AFTER INSERT ON collections
FOR EACH ROW
EXECUTE FUNCTION sync_collection_to_order();

-- Comment for documentation
COMMENT ON FUNCTION sync_collection_to_order() IS 'Automatically syncs collection records to update the parent orders table amount_paid, balance, and status';
