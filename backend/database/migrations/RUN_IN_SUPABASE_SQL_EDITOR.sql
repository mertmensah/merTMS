"""
INSTRUCTIONS: Run this SQL in Supabase SQL Editor
==========================================

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Copy and paste this entire SQL script
4. Click "Run" button

This will add the estimated_delivery_date columns needed for Control Tower
"""

-- Add estimated_delivery_date column to loads table
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

-- Add customer_expected_delivery_date column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_expected_delivery_date DATE;

-- Populate customer_expected_delivery_date from existing delivery_window_end
UPDATE orders 
SET customer_expected_delivery_date = delivery_window_end::DATE 
WHERE customer_expected_delivery_date IS NULL 
  AND delivery_window_end IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_loads_estimated_delivery_date 
ON loads(estimated_delivery_date);

CREATE INDEX IF NOT EXISTS idx_orders_customer_expected_delivery_date 
ON orders(customer_expected_delivery_date);

-- Verify columns were added
SELECT 
    'loads' as table_name,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'loads' 
  AND column_name = 'estimated_delivery_date'
UNION ALL
SELECT 
    'orders' as table_name,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'customer_expected_delivery_date';
