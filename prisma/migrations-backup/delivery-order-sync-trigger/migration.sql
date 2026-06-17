-- Function to sync delivery_orders status changes to orders table
CREATE OR REPLACE FUNCTION sync_delivery_to_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if transaction_id is set (links to orders table)
  IF NEW.transaction_id IS NOT NULL THEN
    -- Update order status based on delivery_orders status
    CASE NEW.status
      WHEN 'IN_TRANSIT' THEN
        UPDATE orders
        SET status = 'ASSIGNED_DELIVERY'
        WHERE id = NEW.transaction_id;

      WHEN 'DELIVERED' THEN
        UPDATE orders
        SET
          status = 'DELIVERED',
          delivery_completed_at = NEW.completed_at,
          delivery_proof_url = NEW.delivery_proof_photo_url
        WHERE id = NEW.transaction_id;

      WHEN 'FAILED' THEN
        -- Keep status as ASSIGNED_DELIVERY but could add a note
        UPDATE orders
        SET status = 'ASSIGNED_DELIVERY'
        WHERE id = NEW.transaction_id;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on delivery_orders
DROP TRIGGER IF EXISTS sync_delivery_to_order_trigger ON delivery_orders;
CREATE TRIGGER sync_delivery_to_order_trigger
AFTER UPDATE OF status ON delivery_orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_delivery_to_order();

-- Comment for documentation
COMMENT ON FUNCTION sync_delivery_to_order() IS 'Automatically syncs delivery_orders status changes to the parent orders table';
