-- Add estimated_delivery_date column to loads table
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

-- Add index for performance when filtering by date
CREATE INDEX IF NOT EXISTS idx_loads_estimated_delivery_date 
ON loads(estimated_delivery_date);

-- Add customer_expected_delivery_date column to orders table for comparison
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_expected_delivery_date DATE;

-- Populate customer_expected_delivery_date from existing delivery_window_end
UPDATE orders 
SET customer_expected_delivery_date = delivery_window_end::DATE 
WHERE customer_expected_delivery_date IS NULL 
  AND delivery_window_end IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_expected_delivery_date 
ON orders(customer_expected_delivery_date);
