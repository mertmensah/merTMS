-- TMS Database Schema for Supabase

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    weight_lbs DECIMAL(10, 2) NOT NULL,
    volume_cuft DECIMAL(10, 2) NOT NULL,
    priority VARCHAR(20) DEFAULT 'Normal',
    status VARCHAR(50) DEFAULT 'Pending',
    delivery_window_start TIMESTAMP,
    delivery_window_end TIMESTAMP,
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Loads Table
CREATE TABLE IF NOT EXISTS loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_number VARCHAR(50) UNIQUE NOT NULL,
    truck_type VARCHAR(50) NOT NULL,
    total_weight_lbs DECIMAL(10, 2) NOT NULL,
    total_volume_cuft DECIMAL(10, 2) NOT NULL,
    utilization_percent DECIMAL(5, 2),
    origin VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Planning',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Load Orders Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS load_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    sequence_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(load_id, order_id)
);

-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
    total_miles DECIMAL(10, 2) NOT NULL,
    total_drive_hours DECIMAL(5, 2) NOT NULL,
    total_days INTEGER,
    fuel_cost_estimate DECIMAL(10, 2),
    efficiency_score INTEGER,
    route_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Route Stops Table
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    stop_number INTEGER NOT NULL,
    location VARCHAR(255) NOT NULL,
    arrival_time TIMESTAMP,
    departure_time TIMESTAMP,
    distance_from_previous_miles DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Carriers Table
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    mc_number VARCHAR(50) UNIQUE,
    dot_number VARCHAR(50),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    rate_per_mile DECIMAL(5, 2),
    truck_types TEXT[],
    rating DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cost Analysis Table
CREATE TABLE IF NOT EXISTS cost_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
    base_freight_cost DECIMAL(10, 2),
    fuel_surcharge DECIMAL(10, 2),
    detention_fees DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    cost_per_mile DECIMAL(5, 2),
    analysis_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_load_orders_load_id ON load_orders(load_id);
CREATE INDEX IF NOT EXISTS idx_load_orders_order_id ON load_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_routes_load_id ON routes(load_id);

-- Enable Row Level Security (RLS) - Optional
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize based on your auth needs)
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on loads" ON loads FOR ALL USING (true);
CREATE POLICY "Allow all operations on routes" ON routes FOR ALL USING (true);
CREATE POLICY "Allow all operations on carriers" ON carriers FOR ALL USING (true);

-- Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    carton_length_in DECIMAL(10, 2) NOT NULL,
    carton_width_in DECIMAL(10, 2) NOT NULL,
    carton_height_in DECIMAL(10, 2) NOT NULL,
    carton_weight_lbs DECIMAL(10, 2) NOT NULL,
    units_per_pallet INTEGER NOT NULL,
    is_hazmat BOOLEAN DEFAULT FALSE,
    hs_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Index
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create Policy (Allow all operations)
DROP POLICY IF EXISTS "Allow all operations on products" ON products;
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);

-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_code VARCHAR(50) UNIQUE NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(50),
    country VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(11, 7) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add facility references to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS origin_facility_id UUID REFERENCES facilities(id),
ADD COLUMN IF NOT EXISTS destination_facility_id UUID REFERENCES facilities(id);

-- Add facility reference to loads table
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS origin_facility_id UUID REFERENCES facilities(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_facilities_facility_type ON facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_facilities_city ON facilities(city);
CREATE INDEX IF NOT EXISTS idx_orders_origin_facility_id ON orders(origin_facility_id);
CREATE INDEX IF NOT EXISTS idx_orders_destination_facility_id ON orders(destination_facility_id);
CREATE INDEX IF NOT EXISTS idx_loads_origin_facility_id ON loads(origin_facility_id);

-- Enable RLS
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on facilities" ON facilities FOR ALL USING (true);

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

-- Create function for mertsightsAI to execute raw SQL queries
-- This enables the RAG system to run dynamic queries generated by Gemini

CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with function owner's privileges
AS $$
DECLARE
    result json;
BEGIN
    -- Security check: ensure query starts with SELECT
    IF query !~* '^\s*SELECT' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Execute query and return as JSON
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
    
    -- Return empty array if no results
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon;

-- Add comment
COMMENT ON FUNCTION execute_sql(text) IS 'Execute read-only SQL queries for mertsightsAI analytics. Only SELECT statements allowed.';

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

-- Cleanup: Remove deprecated tables
DROP TABLE IF EXISTS cost_analysis CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
