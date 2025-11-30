-- Migration: Add Date Tracking for Order and Load Lifecycle
-- Date: 2025-11-29
-- Description: Adds order received date, must arrive by date, planned to load date for orders
--              Adds load created date, must arrive by date, must pick up by date, assigned carrier for loads

-- ====================================
-- ORDERS TABLE - Add Date Columns
-- ====================================

-- Add order_received_date (when customer placed the order)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_received_date TIMESTAMP DEFAULT NOW();

-- Add must_arrive_by_date (hard deadline for delivery)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS must_arrive_by_date TIMESTAMP;

-- Add planned_to_load_date (set when order is assigned to a load)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS planned_to_load_date TIMESTAMP;

-- Add assigned_load_number (reference to which load this order is in)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_load_number VARCHAR(50);

-- ====================================
-- LOADS TABLE - Add Date Columns
-- ====================================

-- Add load_created_date (when load was created)
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS load_created_date TIMESTAMP DEFAULT NOW();

-- Add must_arrive_by_date (earliest must-arrive deadline of all orders in load)
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS must_arrive_by_date TIMESTAMP;

-- Add must_pick_up_by_date (latest pickup time to meet delivery deadline)
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS must_pick_up_by_date TIMESTAMP;

-- Add assigned_carrier (carrier assigned to this load, default NONE)
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS assigned_carrier VARCHAR(255) DEFAULT 'NONE';

-- ====================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ====================================

-- Index on planned_to_load_date for filtering unplanned orders
CREATE INDEX IF NOT EXISTS idx_orders_planned_to_load_date ON orders(planned_to_load_date);

-- Index on must_arrive_by_date for sorting by urgency
CREATE INDEX IF NOT EXISTS idx_orders_must_arrive_by_date ON orders(must_arrive_by_date);

-- Index on order_received_date for chronological ordering
CREATE INDEX IF NOT EXISTS idx_orders_order_received_date ON orders(order_received_date);

-- Index on assigned_load_number for quick lookup
CREATE INDEX IF NOT EXISTS idx_orders_assigned_load_number ON orders(assigned_load_number);

-- Index on load must_arrive_by_date
CREATE INDEX IF NOT EXISTS idx_loads_must_arrive_by_date ON loads(must_arrive_by_date);

-- Index on assigned_carrier
CREATE INDEX IF NOT EXISTS idx_loads_assigned_carrier ON loads(assigned_carrier);

-- ====================================
-- UPDATE EXISTING RECORDS
-- ====================================

-- Set order_received_date to created_at for existing orders if null
UPDATE orders 
SET order_received_date = created_at 
WHERE order_received_date IS NULL;

-- Set must_arrive_by_date to delivery_window_end for existing orders if null
UPDATE orders 
SET must_arrive_by_date = delivery_window_end 
WHERE must_arrive_by_date IS NULL AND delivery_window_end IS NOT NULL;

-- Set load_created_date to created_at for existing loads if null
UPDATE loads 
SET load_created_date = created_at 
WHERE load_created_date IS NULL;

-- ====================================
-- COMMENTS FOR DOCUMENTATION
-- ====================================

COMMENT ON COLUMN orders.order_received_date IS 'Date when customer placed the order';
COMMENT ON COLUMN orders.must_arrive_by_date IS 'Hard deadline for delivery - customer requirement';
COMMENT ON COLUMN orders.planned_to_load_date IS 'Date when order was assigned to a load via Load Builder';
COMMENT ON COLUMN orders.assigned_load_number IS 'Load number this order is assigned to';

COMMENT ON COLUMN loads.load_created_date IS 'Date when load was created by Load Builder';
COMMENT ON COLUMN loads.must_arrive_by_date IS 'Earliest delivery deadline from all orders in this load';
COMMENT ON COLUMN loads.must_pick_up_by_date IS 'Latest pickup time to meet delivery deadline';
COMMENT ON COLUMN loads.assigned_carrier IS 'Carrier assigned to transport this load (default: NONE)';
