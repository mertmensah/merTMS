-- Seed Facilities with Coordinates

-- Origins (Toronto Area Manufacturing Facilities)
INSERT INTO facilities (facility_code, facility_name, facility_type, city, state_province, country, latitude, longitude) VALUES
('TOR-DC', 'Toronto DC', 'origin', 'Toronto', 'ON', 'Canada', 43.6532, -79.3832),
('MIS-PLANT', 'Mississauga Plant', 'origin', 'Mississauga', 'ON', 'Canada', 43.5890, -79.6441),
('BRA-WH', 'Brampton Warehouse', 'origin', 'Brampton', 'ON', 'Canada', 43.7315, -79.7624)
ON CONFLICT (facility_code) DO NOTHING;

-- Destinations (US Customer Locations)
INSERT INTO facilities (facility_code, facility_name, facility_type, city, state_province, country, latitude, longitude) VALUES
-- Northeast
('NYC-DEST', 'New York Distribution', 'destination', 'New York', 'NY', 'USA', 40.7128, -74.0060),
('BOS-DEST', 'Boston Distribution', 'destination', 'Boston', 'MA', 'USA', 42.3601, -71.0589),
('PHL-DEST', 'Philadelphia Distribution', 'destination', 'Philadelphia', 'PA', 'USA', 39.9526, -75.1652),
('BUF-DEST', 'Buffalo Distribution', 'destination', 'Buffalo', 'NY', 'USA', 42.8864, -78.8784),
('PIT-DEST', 'Pittsburgh Distribution', 'destination', 'Pittsburgh', 'PA', 'USA', 40.4406, -79.9959),

-- Midwest
('CHI-DEST', 'Chicago Distribution', 'destination', 'Chicago', 'IL', 'USA', 41.8781, -87.6298),
('DET-DEST', 'Detroit Distribution', 'destination', 'Detroit', 'MI', 'USA', 42.3314, -83.0458),
('CLE-DEST', 'Cleveland Distribution', 'destination', 'Cleveland', 'OH', 'USA', 41.4993, -81.6944),
('IND-DEST', 'Indianapolis Distribution', 'destination', 'Indianapolis', 'IN', 'USA', 39.7684, -86.1581),
('MIL-DEST', 'Milwaukee Distribution', 'destination', 'Milwaukee', 'WI', 'USA', 43.0389, -87.9065),
('COL-DEST', 'Columbus Distribution', 'destination', 'Columbus', 'OH', 'USA', 39.9612, -82.9988),
('MIN-DEST', 'Minneapolis Distribution', 'destination', 'Minneapolis', 'MN', 'USA', 44.9778, -93.2650),

-- Southeast
('ATL-DEST', 'Atlanta Distribution', 'destination', 'Atlanta', 'GA', 'USA', 33.7490, -84.3880),
('CLT-DEST', 'Charlotte Distribution', 'destination', 'Charlotte', 'NC', 'USA', 35.2271, -80.8431),
('NSH-DEST', 'Nashville Distribution', 'destination', 'Nashville', 'TN', 'USA', 36.1627, -86.7816),
('JAX-DEST', 'Jacksonville Distribution', 'destination', 'Jacksonville', 'FL', 'USA', 30.3322, -81.6557),
('MIA-DEST', 'Miami Distribution', 'destination', 'Miami', 'FL', 'USA', 25.7617, -80.1918),
('ORL-DEST', 'Orlando Distribution', 'destination', 'Orlando', 'FL', 'USA', 28.5383, -81.3792),

-- Southwest
('DAL-DEST', 'Dallas Distribution', 'destination', 'Dallas', 'TX', 'USA', 32.7767, -96.7970),
('HOU-DEST', 'Houston Distribution', 'destination', 'Houston', 'TX', 'USA', 29.7604, -95.3698),
('PHX-DEST', 'Phoenix Distribution', 'destination', 'Phoenix', 'AZ', 'USA', 33.4484, -112.0740),
('SAT-DEST', 'San Antonio Distribution', 'destination', 'San Antonio', 'TX', 'USA', 29.4241, -98.4936),
('DEN-DEST', 'Denver Distribution', 'destination', 'Denver', 'CO', 'USA', 39.7392, -104.9903),

-- West
('LAX-DEST', 'Los Angeles Distribution', 'destination', 'Los Angeles', 'CA', 'USA', 34.0522, -118.2437),
('SFO-DEST', 'San Francisco Distribution', 'destination', 'San Francisco', 'CA', 'USA', 37.7749, -122.4194),
('SEA-DEST', 'Seattle Distribution', 'destination', 'Seattle', 'WA', 'USA', 47.6062, -122.3321),
('PDX-DEST', 'Portland Distribution', 'destination', 'Portland', 'OR', 'USA', 45.5152, -122.6784),
('SAN-DEST', 'San Diego Distribution', 'destination', 'San Diego', 'CA', 'USA', 32.7157, -117.1611),
('LAS-DEST', 'Las Vegas Distribution', 'destination', 'Las Vegas', 'NV', 'USA', 36.1699, -115.1398)
ON CONFLICT (facility_code) DO NOTHING;
