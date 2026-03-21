-- ============================================
-- TMS Database Schema for Supabase (Optimized)
-- ============================================
-- Last Updated: 2026-01-04
-- Description: Clean, optimized schema with unused tables removed

-- ============================================
-- CORE TRANSPORTATION TABLES
-- ============================================

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
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Date tracking columns
    order_received_date TIMESTAMP DEFAULT NOW(),
    must_arrive_by_date TIMESTAMP,
    planned_to_load_date TIMESTAMP,
    assigned_load_number VARCHAR(50),
    customer_expected_delivery_date DATE,
    -- Facility references
    origin_facility_id UUID,
    destination_facility_id UUID
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
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Date tracking columns
    load_created_date TIMESTAMP DEFAULT NOW(),
    must_arrive_by_date TIMESTAMP,
    must_pick_up_by_date TIMESTAMP,
    estimated_delivery_date DATE,
    assigned_carrier VARCHAR(255) DEFAULT 'NONE',
    -- Facility reference
    origin_facility_id UUID
);

-- Load Orders Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS load_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL,
    order_id UUID NOT NULL,
    sequence_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(load_id, order_id)
);

-- ============================================
-- SUPPORTING TABLES
-- ============================================

-- Facilities Table
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

-- Products Table
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

-- ============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_origin_facility 
FOREIGN KEY (origin_facility_id) REFERENCES facilities(id) ON DELETE SET NULL;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_destination_facility 
FOREIGN KEY (destination_facility_id) REFERENCES facilities(id) ON DELETE SET NULL;

ALTER TABLE loads 
ADD CONSTRAINT fk_loads_origin_facility 
FOREIGN KEY (origin_facility_id) REFERENCES facilities(id) ON DELETE SET NULL;

ALTER TABLE load_orders 
ADD CONSTRAINT fk_load_orders_load 
FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE;

ALTER TABLE load_orders 
ADD CONSTRAINT fk_load_orders_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_planned_to_load_date ON orders(planned_to_load_date);
CREATE INDEX IF NOT EXISTS idx_orders_must_arrive_by_date ON orders(must_arrive_by_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_received_date ON orders(order_received_date);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_load_number ON orders(assigned_load_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_expected_delivery_date ON orders(customer_expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_origin_facility_id ON orders(origin_facility_id);
CREATE INDEX IF NOT EXISTS idx_orders_destination_facility_id ON orders(destination_facility_id);

-- Loads indexes
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_must_arrive_by_date ON loads(must_arrive_by_date);
CREATE INDEX IF NOT EXISTS idx_loads_assigned_carrier ON loads(assigned_carrier);
CREATE INDEX IF NOT EXISTS idx_loads_estimated_delivery_date ON loads(estimated_delivery_date);
CREATE INDEX IF NOT EXISTS idx_loads_origin_facility_id ON loads(origin_facility_id);

-- Load Orders indexes
CREATE INDEX IF NOT EXISTS idx_load_orders_load_id ON load_orders(load_id);
CREATE INDEX IF NOT EXISTS idx_load_orders_order_id ON load_orders(order_id);

-- Facilities indexes
CREATE INDEX IF NOT EXISTS idx_facilities_facility_type ON facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_facilities_city ON facilities(city);

-- Products index
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize based on your auth needs)
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on loads" ON loads;
CREATE POLICY "Allow all operations on loads" ON loads FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on facilities" ON facilities;
CREATE POLICY "Allow all operations on facilities" ON facilities FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on products" ON products;
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on carriers" ON carriers;
CREATE POLICY "Allow all operations on carriers" ON carriers FOR ALL USING (true);

-- ============================================
-- COLUMN COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN orders.order_received_date IS 'Date when customer placed the order';
COMMENT ON COLUMN orders.must_arrive_by_date IS 'Hard deadline for delivery - customer requirement';
COMMENT ON COLUMN orders.planned_to_load_date IS 'Date when order was assigned to a load via Load Builder';
COMMENT ON COLUMN orders.assigned_load_number IS 'Load number this order is assigned to';

COMMENT ON COLUMN loads.load_created_date IS 'Date when load was created by Load Builder';
COMMENT ON COLUMN loads.must_arrive_by_date IS 'Earliest delivery deadline from all orders in this load';
COMMENT ON COLUMN loads.must_pick_up_by_date IS 'Latest pickup time to meet delivery deadline';
COMMENT ON COLUMN loads.assigned_carrier IS 'Carrier assigned to transport this load (default: NONE)';

-- ============================================
-- CUSTOM FUNCTIONS
-- ============================================

-- Function for mertsightsAI to execute raw SQL queries
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon;

COMMENT ON FUNCTION execute_sql(text) IS 'Execute read-only SQL queries for mertsightsAI analytics. Only SELECT statements allowed.';

-- ============================================
-- DATA MIGRATION & CLEANUP
-- ============================================

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

-- Populate customer_expected_delivery_date from existing delivery_window_end
UPDATE orders 
SET customer_expected_delivery_date = delivery_window_end::DATE 
WHERE customer_expected_delivery_date IS NULL 
  AND delivery_window_end IS NOT NULL;

-- ============================================
-- REMOVE UNUSED TABLES (Safe to run multiple times)
-- ============================================

DROP TABLE IF EXISTS cost_analysis CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
