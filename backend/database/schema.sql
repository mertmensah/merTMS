-- TMS Database Schema for Supabase

-- Facilities Table (Origins and Destinations with Coordinates)
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_code VARCHAR(50) UNIQUE NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL, -- 'origin' or 'destination'
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

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    origin_facility_id UUID REFERENCES facilities(id),
    destination VARCHAR(255) NOT NULL,
    destination_facility_id UUID REFERENCES facilities(id),
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
    origin_facility_id UUID REFERENCES facilities(id),
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
CREATE INDEX IF NOT EXISTS idx_facilities_facility_type ON facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_facilities_city ON facilities(city);
CREATE INDEX IF NOT EXISTS idx_orders_origin_facility_id ON orders(origin_facility_id);
CREATE INDEX IF NOT EXISTS idx_orders_destination_facility_id ON orders(destination_facility_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_loads_origin_facility_id ON loads(origin_facility_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_load_orders_load_id ON load_orders(load_id);
CREATE INDEX IF NOT EXISTS idx_load_orders_order_id ON load_orders(order_id);

-- Enable Row Level Security (RLS) - Optional
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize based on your auth needs)
CREATE POLICY "Allow all operations on facilities" ON facilities FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on loads" ON loads FOR ALL USING (true);
CREATE POLICY "Allow all operations on carriers" ON carriers FOR ALL USING (true);