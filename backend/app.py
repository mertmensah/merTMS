"""
TMS Flask Application
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import sys
import os

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.settings import PORT, DEBUG
from utils.keep_alive import keep_alive, initialize_keep_alive

app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173", 
            "http://localhost:5174", 
            "http://localhost:3000",
            "https://mertmensah.github.io"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "TMS Backend"}), 200

# Supabase Keep-Alive endpoint
@app.route('/api/keep-alive', methods=['GET'])
def keep_alive_endpoint():
    """
    Endpoint to manually trigger Supabase keep-alive ping.
    Can be called by external cron services (UptimeRobot, cron-job.org, etc.)
    to ensure database stays active.
    
    Recommended: Ping this endpoint every 3-7 days as a backup.
    """
    try:
        # Check if enough time has passed (prevents excessive pinging)
        if keep_alive.should_ping(min_interval_seconds=3600):  # Max once per hour
            result = keep_alive.ping_database()
            return jsonify(result), 200
        else:
            # Return cached status if pinged too recently
            return jsonify({
                'success': True,
                'message': 'Ping skipped - too soon since last ping',
                'status': keep_alive.get_status()
            }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Keep-alive ping failed'
        }), 500

# Network Engineering - Facility Location endpoint
@app.route('/api/network/facility-location', methods=['POST'])
def facility_location_analysis():
    from database.supabase_client import SupabaseClient
    import numpy as np
    from sklearn.cluster import KMeans
    from math import radians, sin, cos, sqrt, atan2
    
    try:
        data = request.get_json()
        k = data.get('k', 3)  # Number of facilities/centers
        
        # Get orders and facilities from database
        client = SupabaseClient()
        orders = client.get_all_orders()
        facilities = client.get_all_facilities()
        
        if not orders or len(orders) == 0:
            return jsonify({"error": "No orders available for analysis"}), 400
        
        # Create facility lookup by city/name
        facility_lookup = {}
        for facility in facilities:
            facility_name = facility.get('name', '')
            city = facility.get('city', '')
            lat = facility.get('latitude')
            lon = facility.get('longitude')
            
            if lat and lon:
                facility_lookup[facility_name.lower()] = {'lat': lat, 'lon': lon, 'city': city, 'state': facility.get('state', '')}
                if city:
                    facility_lookup[city.lower()] = {'lat': lat, 'lon': lon, 'city': city, 'state': facility.get('state', '')}
        
        # Step 1: Group orders by unique customer location and aggregate weights
        location_dict = {}
        
        for order in orders:
            destination = order.get('destination', '')
            weight = order.get('weight_lbs')  # Changed from 'weight' to 'weight_lbs'
            customer = order.get('customer', 'Unknown')
            
            # Skip orders without valid destination or weight
            if not destination or not weight:
                continue
            
            try:
                wgt = float(weight)
            except (ValueError, TypeError):
                continue
            
            # Try to find coordinates for this destination
            # Parse destination string (e.g., "Orlando, FL" or "Houston, TX - Houston DC")
            dest_lower = destination.lower()
            coords = None
            
            # Try exact match first
            if dest_lower in facility_lookup:
                coords = facility_lookup[dest_lower]
            else:
                # Try to extract city from destination string
                parts = destination.split(',')
                if len(parts) >= 2:
                    city = parts[0].strip().lower()
                    if city in facility_lookup:
                        coords = facility_lookup[city]
                elif '-' in destination:
                    # Handle format like "Houston, TX - Houston DC"
                    city = destination.split(',')[0].strip().lower()
                    if city in facility_lookup:
                        coords = facility_lookup[city]
            
            if not coords:
                continue  # Skip if we can't find coordinates
            
            lat = coords['lat']
            lon = coords['lon']
            
            # Create a unique key for this location (rounded to 4 decimals for grouping)
            location_key = (round(lat, 4), round(lon, 4))
            
            if location_key not in location_dict:
                location_dict[location_key] = {
                    'lat': lat,
                    'lon': lon,
                    'total_weight': 0,
                    'customer_name': customer,
                    'city': coords.get('city', ''),
                    'state': coords.get('state', ''),
                    'order_count': 0
                }
            
            location_dict[location_key]['total_weight'] += wgt
            location_dict[location_key]['order_count'] += 1
            # Update city/state if this location has better info
            if not location_dict[location_key]['state'] and coords.get('state'):
                location_dict[location_key]['state'] = coords.get('state', '')
            if not location_dict[location_key]['city'] and coords.get('city'):
                location_dict[location_key]['city'] = coords.get('city', '')
        
        # Step 2: Convert aggregated locations to list
        customer_locations = list(location_dict.values())
        
        if len(customer_locations) == 0:
            return jsonify({"error": "No valid customer locations found in orders. Orders may not have matching facilities in database."}), 400
        
        if len(customer_locations) < k:
            return jsonify({
                "error": f"Only {len(customer_locations)} unique customer location(s) found. Need at least {k} locations for {k} facilities. Try reducing k."
            }), 400
        
        # Step 3: Prepare data for K-means clustering
        coords = np.array([[loc['lat'], loc['lon']] for loc in customer_locations])
        weights = np.array([loc['total_weight'] for loc in customer_locations])
        
        # Step 4: Perform weighted K-means clustering
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords, sample_weight=weights)
        centers = kmeans.cluster_centers_
        
        # Haversine distance function
        def haversine_distance(lat1, lon1, lat2, lon2):
            R = 3959  # Earth radius in miles
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            return R * c
        
        # Step 5: Calculate metrics for each facility
        facilities = []
        for i, center in enumerate(centers):
            facility_lat, facility_lon = center[0], center[1]
            
            # Get customers assigned to this facility
            cluster_locations = [customer_locations[j] for j in range(len(customer_locations)) if labels[j] == i]
            
            # Calculate average distance to customers
            distances = [haversine_distance(facility_lat, facility_lon, loc['lat'], loc['lon']) for loc in cluster_locations]
            avg_distance = sum(distances) / len(distances) if distances else 0
            total_volume = sum([loc['total_weight'] for loc in cluster_locations])
            total_orders = sum([loc['order_count'] for loc in cluster_locations])
            
            # Find nearest city using reverse geocoding approximation
            closest_location = min(cluster_locations, key=lambda loc: haversine_distance(facility_lat, facility_lon, loc['lat'], loc['lon']))
            
            facilities.append({
                'facility_id': i + 1,
                'latitude': float(facility_lat),
                'longitude': float(facility_lon),
                'nearest_city': closest_location['city'] or 'Unknown',
                'nearest_state': closest_location['state'] or 'Unknown',
                'avg_customer_distance': round(avg_distance, 1),
                'total_volume': round(total_volume, 0),
                'num_customers': len(cluster_locations),
                'total_orders': total_orders,
                'cluster_label': i
            })
        
        # Step 6: Prepare demand points for visualization
        demand_points = []
        for i, location in enumerate(customer_locations):
            demand_points.append({
                'latitude': location['lat'],
                'longitude': location['lon'],
                'weight': location['total_weight'],
                'customer': location['customer_name'],
                'city': location['city'],
                'state': location['state'],
                'order_count': location['order_count'],
                'assigned_facility': int(labels[i]) + 1
            })
        
        return jsonify({
            'facilities': facilities,
            'demand_points': demand_points,
            'k': k,
            'total_demand': float(sum(weights)),
            'unique_locations': len(customer_locations),
            'total_orders_analyzed': sum([loc['order_count'] for loc in customer_locations]),
            'analysis_date': pd.Timestamp.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"Facility location analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Orders API
@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders from database"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        orders = client.get_all_orders()
        return jsonify({"data": orders}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create new order"""
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        client = SupabaseClient()
        order = client.create_order(data)
        return jsonify({"message": "Order created", "order": order}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/generate', methods=['POST'])
def generate_synthetic_orders():
    """Generate synthetic orders for testing"""
    from utils.erp_data_generator import ERPDataGenerator
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        count = data.get('count', 10)
        monthly = data.get('monthly', False)
        
        gen = ERPDataGenerator()
        client = SupabaseClient()
        
        # Get facilities for ID lookup
        facilities = client.get_all_facilities()
        facility_map = {f['facility_code']: f['id'] for f in facilities}
        
        if monthly:
            # Generate a full month of orders (~4,000)
            orders = gen.generate_monthly_orders()
        else:
            orders = gen.generate_orders(count)
        
        # Add facility IDs to orders based on facility_code
        for order in orders:
            # Match origin facility code to facility ID
            origin_code = order.get('origin_facility_code')
            if origin_code and origin_code in facility_map:
                order['origin_facility_id'] = facility_map[origin_code]
            
            # Destination facility ID will be null for now (customer sites)
            order['destination_facility_id'] = None
            
            # Remove the temporary facility_code field
            order.pop('origin_facility_code', None)
        
        # Debug: Print first order structure
        print(f"[ORDER GEN] Attempting to insert {len(orders)} orders")
        if orders:
            print(f"[ORDER GEN] Sample order keys: {list(orders[0].keys())}")
        
        # Insert orders
        if monthly:
            result = client.create_orders_batch_chunked(orders, chunk_size=100)
            print(f"[ORDER GEN] Inserted {len(result)} orders (monthly batch)")
            return jsonify({"message": f"Generated {len(result)} orders", "count": len(result)}), 201
        else:
            result = client.create_orders_batch(orders)
            print(f"[ORDER GEN] Inserted {len(result)} orders")
            if not result:
                return jsonify({"error": "Failed to insert orders - result is empty", "count": 0}), 500
            return jsonify({"message": f"Generated {len(result)} orders", "count": len(result), "orders": result}), 201
    except Exception as e:
        print(f"[ORDER GEN ERROR] {str(e)}")  # Log the error
        import traceback
        traceback.print_exc()  # Print full stack trace
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/clear', methods=['DELETE'])
def clear_all_orders():
    """Clear all orders from database"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        result = client.delete_all_orders()
        return jsonify({"message": "All orders cleared", "deleted_count": len(result)}), 200
    except Exception as e:
        print(f"Error clearing orders: {str(e)}")  # Log the error
        return jsonify({"error": str(e)}), 500

# Load Optimization API
@app.route('/api/loads/optimize', methods=['POST'])
def optimize_loads():
    """Optimize orders into truck loads and save to database"""
    from database.supabase_client import SupabaseClient
    from agents.load_optimizer import LoadOptimizerAgent
    from datetime import datetime
    try:
        data = request.json
        order_ids = data.get('order_ids', [])
        
        # 1. Fetch orders from Supabase
        client = SupabaseClient()
        if order_ids:
            orders = client.get_all_orders()
            orders = [o for o in orders if o['id'] in order_ids]
        else:
            orders = client.get_all_orders()
            # Filter for Pending status AND no planned_to_load_date (not yet assigned to a load)
            orders = [o for o in orders if o.get('status') == 'Pending' and not o.get('planned_to_load_date')]
        
        if not orders:
            return jsonify({
                "loads": [],
                "summary": {
                    "total_orders": 0,
                    "total_loads": 0,
                    "avg_utilization": 0,
                    "cost_savings_percent": 0,
                    "message": "No unplanned orders available for optimization"
                }
            }), 200
        
        print(f"[LOAD OPTIMIZER] Found {len(orders)} eligible orders (no planned_to_load_date)")
        
        # 2. Use LoadOptimizerAgent to create load plan
        optimizer = LoadOptimizerAgent()
        load_plan = optimizer.optimize_loads(orders)
        
        print(f"[DEBUG] Optimizer returned {len(load_plan.get('loads', []))} loads")
        print(f"[DEBUG] Starting database save process...")
        
        # 3. Save loads to database with date tracking
        saved_count = 0
        current_time = datetime.utcnow().isoformat()
        
        for load in load_plan.get('loads', []):
            try:
                # Handle both AI format (total_weight, total_volume) and fallback format (total_weight_lbs, total_volume_cuft)
                total_weight = load.get('total_weight_lbs') or load.get('total_weight', 0)
                total_volume = load.get('total_volume_cuft') or load.get('total_volume', 0)
                utilization = load.get('utilization_percent') or load.get('utilization', 0)
                
                # Calculate must_arrive_by_date (earliest deadline from all orders in load)
                must_arrive_dates = [o.get('must_arrive_by_date') or o.get('delivery_window_end') 
                                    for o in load['orders'] if o.get('must_arrive_by_date') or o.get('delivery_window_end')]
                earliest_deadline = min(must_arrive_dates) if must_arrive_dates else None
                
                # Calculate must_pick_up_by_date (48 hours before earliest delivery for now)
                # TODO: Enhance with actual route planning integration
                must_pick_up_date = None
                if earliest_deadline:
                    from datetime import datetime, timedelta
                    if isinstance(earliest_deadline, str):
                        deadline_dt = datetime.fromisoformat(earliest_deadline.replace('Z', '+00:00'))
                    else:
                        deadline_dt = earliest_deadline
                    must_pick_up_date = (deadline_dt - timedelta(hours=48)).isoformat()
                
                load_data = {
                    'load_number': load['load_id'],
                    'truck_type': 'Dry Van 53ft',
                    'total_weight_lbs': float(total_weight),
                    'total_volume_cuft': float(total_volume),
                    'utilization_percent': float(utilization),
                    'origin': load['orders'][0]['origin'] if load['orders'] else 'Unknown',
                    'status': 'Planning',
                    'load_created_date': current_time,
                    'must_arrive_by_date': earliest_deadline,
                    'must_pick_up_by_date': must_pick_up_date,
                    'assigned_carrier': 'NONE'
                }
                print(f"[DEBUG] Attempting to save load {load_data['load_number']}")
                created_load = client.create_load(load_data)
                print(f"[SUCCESS] Created load: {created_load.get('id') if created_load else 'NONE'}")
                saved_count += 1
                
                # 4. Create load_orders relationships AND update orders with planned_to_load_date
                if created_load:
                    load_orders = []
                    for order in load['orders']:
                        load_orders.append({
                            'load_id': created_load['id'],
                            'order_id': order['id'],
                            'sequence_number': order.get('stop_sequence', 1)
                        })
                        
                        # Update order with planned_to_load_date and assigned_load_number
                        try:
                            client.update_order(order['id'], {
                                'planned_to_load_date': current_time,
                                'assigned_load_number': load['load_id'],
                                'status': 'Assigned'
                            })
                            print(f"[SUCCESS] Updated order {order.get('order_number')} with planned_to_load_date")
                        except Exception as order_update_error:
                            print(f"[WARNING] Failed to update order {order.get('order_number')}: {str(order_update_error)}")
                    
                    if load_orders:
                        client.create_load_orders_batch(load_orders)
                    
            except Exception as load_error:
                print(f"[ERROR] Saving load {load.get('load_id')}: {str(load_error)}")
                import traceback
                traceback.print_exc()
        
        print(f"[COMPLETE] Save process complete. Saved {saved_count} of {len(load_plan.get('loads', []))} loads")
        return jsonify(load_plan), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Route Planning API
@app.route('/api/routes/optimize', methods=['POST'])
def optimize_route():
    """Optimize delivery route for a load"""
    from agents.route_planner import RoutePlannerAgent
    try:
        data = request.json
        load_data = data.get('load_data', {})
        
        # Use RoutePlannerAgent to create optimal route
        planner = RoutePlannerAgent()
        route_plan = planner.plan_route(load_data)
        
        return jsonify(route_plan), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Cost Analysis API
@app.route('/api/costs/analyze', methods=['POST'])
def analyze_costs():
    """Analyze costs for loads and routes"""
    from agents.cost_analyzer import CostAnalyzerAgent
    try:
        data = request.json
        load_plan = data.get('load_plan', {})
        route_plan = data.get('route_plan', {})
        
        # Use CostAnalyzerAgent to analyze costs
        analyzer = CostAnalyzerAgent()
        cost_analysis = analyzer.analyze_costs(load_plan, route_plan)
        
        return jsonify(cost_analysis), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Analytics Dashboard API
@app.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_analytics():
    """Get dashboard analytics and KPIs"""
    # TODO: Query Supabase for analytics data
    return jsonify({
        "active_shipments": 0,
        "total_orders": 0,
        "avg_utilization": 0,
        "cost_savings_ytd": 0
    }), 200

# Products API
@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products from database"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        products = client.get_all_products()
        return jsonify({"data": products}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/products', methods=['POST'])
def create_product():
    """Create new product"""
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        client = SupabaseClient()
        product = client.create_product(data)
        return jsonify({"message": "Product created", "product": product}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/seed', methods=['POST'])
def seed_products():
    """Seed initial product data"""
    from database.supabase_client import SupabaseClient
    try:
        products = [
            {
                "product_id": "PROD-001",
                "name": "Frozen Pizza - Supreme 12in",
                "description": "Premium frozen pizza with pepperoni, sausage, peppers, and mushrooms",
                "carton_length_in": 14.0,
                "carton_width_in": 14.0,
                "carton_height_in": 2.5,
                "carton_weight_lbs": 2.8,
                "units_per_pallet": 120,
                "is_hazmat": False,
                "hs_code": "1902.20.00"
            },
            {
                "product_id": "PROD-002",
                "name": "Industrial Cleaning Solution",
                "description": "Heavy-duty degreaser for commercial kitchens - 1 gallon bottles",
                "carton_length_in": 12.0,
                "carton_width_in": 10.0,
                "carton_height_in": 10.0,
                "carton_weight_lbs": 9.2,
                "units_per_pallet": 80,
                "is_hazmat": True,
                "hs_code": "3402.20.50"
            },
            {
                "product_id": "PROD-003",
                "name": "Organic Pasta - Penne 1lb",
                "description": "Whole wheat organic penne pasta in retail packaging",
                "carton_length_in": 18.0,
                "carton_width_in": 12.0,
                "carton_height_in": 8.0,
                "carton_weight_lbs": 12.5,
                "units_per_pallet": 150,
                "is_hazmat": False,
                "hs_code": "1902.19.20"
            },
            {
                "product_id": "PROD-004",
                "name": "Disposable Gloves - Nitrile (Box of 100)",
                "description": "Industrial grade nitrile gloves, powder-free, size large",
                "carton_length_in": 10.0,
                "carton_width_in": 6.0,
                "carton_height_in": 5.0,
                "carton_weight_lbs": 1.8,
                "units_per_pallet": 240,
                "is_hazmat": False,
                "hs_code": "4015.19.10"
            },
            {
                "product_id": "PROD-005",
                "name": "Canned Tomatoes - Crushed 28oz",
                "description": "Premium Italian-style crushed tomatoes in 28oz cans, 12-pack",
                "carton_length_in": 15.0,
                "carton_width_in": 10.0,
                "carton_height_in": 6.0,
                "carton_weight_lbs": 22.0,
                "units_per_pallet": 100,
                "is_hazmat": False,
                "hs_code": "2002.90.90"
            },
            {
                "product_id": "PROD-006",
                "name": "Hand Sanitizer Gel - 1 Gallon",
                "description": "70% alcohol-based hand sanitizer, commercial use",
                "carton_length_in": 11.0,
                "carton_width_in": 9.0,
                "carton_height_in": 11.0,
                "carton_weight_lbs": 8.8,
                "units_per_pallet": 64,
                "is_hazmat": True,
                "hs_code": "3808.94.50"
            },
            {
                "product_id": "PROD-007",
                "name": "Premium Coffee Beans - 5lb Bag",
                "description": "Arabica coffee beans, medium roast, whole bean",
                "carton_length_in": 16.0,
                "carton_width_in": 12.0,
                "carton_height_in": 4.0,
                "carton_weight_lbs": 5.5,
                "units_per_pallet": 180,
                "is_hazmat": False,
                "hs_code": "0901.21.00"
            },
            {
                "product_id": "PROD-008",
                "name": "Stainless Steel Cookware Set",
                "description": "Professional 10-piece stainless steel cookware set with lids",
                "carton_length_in": 20.0,
                "carton_width_in": 20.0,
                "carton_height_in": 12.0,
                "carton_weight_lbs": 28.0,
                "units_per_pallet": 40,
                "is_hazmat": False,
                "hs_code": "7323.93.00"
            },
            {
                "product_id": "PROD-009",
                "name": "Paper Towels - Commercial Roll",
                "description": "Industrial paper towel rolls, 12 rolls per case",
                "carton_length_in": 22.0,
                "carton_width_in": 16.0,
                "carton_height_in": 11.0,
                "carton_weight_lbs": 18.5,
                "units_per_pallet": 72,
                "is_hazmat": False,
                "hs_code": "4818.20.00"
            },
            {
                "product_id": "PROD-010",
                "name": "Aerosol Cooking Spray",
                "description": "Non-stick cooking spray in aerosol can, 12-pack",
                "carton_length_in": 13.0,
                "carton_width_in": 10.0,
                "carton_height_in": 9.0,
                "carton_weight_lbs": 7.2,
                "units_per_pallet": 96,
                "is_hazmat": True,
                "hs_code": "1517.90.90"
            }
        ]
        
        client = SupabaseClient()
        result = client.create_products_batch(products)
        return jsonify({"message": f"Seeded {len(result)} products", "products": result}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# People Management API
@app.route('/api/people', methods=['GET'])
def get_people():
    """Get all people from database"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        people = client.supabase.table('people').select('*').order('name').execute()
        return jsonify({"data": people.data}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/people', methods=['POST'])
def create_person():
    """Create new person"""
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        client = SupabaseClient()
        result = client.supabase.table('people').insert(data).execute()
        return jsonify({"message": "Person created", "person": result.data[0]}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/people/<person_id>', methods=['PUT'])
def update_person(person_id):
    """Update person by ID"""
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        client = SupabaseClient()
        result = client.supabase.table('people').update(data).eq('id', person_id).execute()
        return jsonify({"message": "Person updated", "person": result.data[0]}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/people/<person_id>', methods=['DELETE'])
def delete_person(person_id):
    """Delete person by ID"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        client.supabase.table('people').delete().eq('id', person_id).execute()
        return jsonify({"message": "Person deleted"}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Projects API
@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects from database"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        projects = client.supabase.table('projects').select('*, owner:people!owner_id(*)').order('created_at', desc=True).execute()
        return jsonify({"data": projects.data}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects', methods=['POST'])
def create_project():
    """Create new project"""
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        client = SupabaseClient()
        result = client.supabase.table('projects').insert(data).execute()
        return jsonify({"message": "Project created", "project": result.data[0]}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/<project_id>/stories', methods=['GET'])
def get_project_stories(project_id):
    """Get all stories for a project"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        stories = client.supabase.table('stories').select('*, assignee:people!assignee_id(*)').eq('project_id', project_id).order('created_at').execute()
        return jsonify({"data": stories.data}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/stories', methods=['POST'])
def create_story():
    """Create new story"""
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        client = SupabaseClient()
        result = client.supabase.table('stories').insert(data).execute()
        return jsonify({"message": "Story created", "story": result.data[0]}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/stories/<story_id>', methods=['PUT'])
def update_story(story_id):
    """Update story by ID"""
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        client = SupabaseClient()
        result = client.supabase.table('stories').update(data).eq('id', story_id).execute()
        return jsonify({"message": "Story updated", "story": result.data[0]}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Carrier Management API
@app.route('/api/carriers', methods=['GET'])
def get_carriers():
    """Get all carriers"""
    # TODO: Query Supabase for carriers
    return jsonify({"carriers": []}), 200

# Facilities API
@app.route('/api/facilities', methods=['GET'])
def get_facilities():
    """Get all facilities from database"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        facilities = client.get_all_facilities()
        return jsonify({"data": facilities}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/facilities/code/<facility_code>', methods=['GET'])
def get_facility_by_code(facility_code):
    """Get facility by facility code"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        facility = client.get_facility_by_code(facility_code)
        if facility:
            return jsonify({"data": facility}), 200
        else:
            return jsonify({"error": "Facility not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/facilities/city/<city>', methods=['GET'])
def get_facility_by_city(city):
    """Get facility by city name"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        facility = client.get_facility_by_city(city)
        if facility:
            return jsonify({"data": facility}), 200
        else:
            return jsonify({"error": "Facility not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/facilities/origins', methods=['GET'])
def get_origins():
    """Get all origin facilities"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        origins = client.get_origins()
        return jsonify({"data": origins}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/facilities/destinations', methods=['GET'])
def get_destinations():
    """Get all destination facilities"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        destinations = client.get_destinations()
        return jsonify({"data": destinations}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Loads API
@app.route('/api/loads', methods=['GET'])
def get_loads():
    """Get all loads from database"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        loads = client.get_all_loads()
        return jsonify({"data": loads}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def generate_fallback_simulation_plan(available_orders, existing_loads, today_str):
    """
    Fallback simulation plan generator when AI is not available
    Creates a simple but realistic simulation plan without AI
    """
    from datetime import datetime, timedelta
    import random
    
    today = datetime.strptime(today_str, '%Y-%m-%d').date()
    tomorrow = today + timedelta(days=1)
    
    # Get next CT load number
    ct_loads = [l for l in existing_loads if l.get('load_number', '').startswith('CT-')]
    next_ct_num = len(ct_loads) + 1
    
    # Create 8 simple load configurations
    loads = []
    orders_per_load = len(available_orders) // 8
    
    scenarios = [
        ('delivered', 'Delivered', today_str, today_str),
        ('delivered', 'Delivered', today_str, today_str),
        ('on-time', 'In Transit', today_str, today_str),
        ('on-time', 'In Transit', today_str, today_str),
        ('on-time', 'In Transit', today_str, today_str),
        ('at-risk', 'In Transit', today_str, str(tomorrow)),
        ('at-risk', 'In Transit', today_str, str(tomorrow)),
        ('at-risk', 'In Transit', today_str, str(tomorrow)),
    ]
    
    for i, (scenario, status, ced, edd) in enumerate(scenarios):
        start_idx = i * orders_per_load
        end_idx = start_idx + orders_per_load if i < 7 else len(available_orders)
        
        loads.append({
            'load_number': f'CT-{next_ct_num + i:05d}',
            'truck_type': random.choice(['DRY_VAN', 'REEFER']),
            'origin': 'Dallas, TX',
            'status': status,
            'estimated_delivery_date': edd,
            'scenario': scenario,
            'order_indices': list(range(start_idx, end_idx)),
            'orders_config': {
                'status': status,
                'customer_expected_delivery_date': ced,
                'delivery_window_start': '08:00:00',
                'delivery_window_end': '17:00:00'
            }
        })
    
    return {
        'loads': loads,
        'summary': {
            'delivered': 2,
            'on_time': 3,
            'at_risk': 3
        }
    }

@app.route('/api/loads/simulate-today', methods=['POST'])
def simulate_today_loads():
    """Generate simulated loads for today's delivery using AI agent (for Control Tower testing)"""
    print("\n" + "="*80)
    print("[SIMULATE-001] ✓ Route handler called - simulate_today_loads()")
    print("="*80)
    
    from database.supabase_client import SupabaseClient
    from datetime import datetime
    import random
    
    try:
        print("[SIMULATE-002] ✓ Initializing database client...")
        client = SupabaseClient()
        print("[SIMULATE-003] ✓ Database client initialized successfully")
        
        # Try to import AI agent, but fallback to manual logic if unavailable
        try:
            from agents.control_tower_simulator import ControlTowerSimulatorAgent
            agent = ControlTowerSimulatorAgent()
            use_ai = True
            print("[SIMULATE-003a] ✓ AI agent initialized successfully")
        except Exception as ai_error:
            print(f"[SIMULATE-003b] ⚠ AI agent unavailable: {str(ai_error)}")
            print("[SIMULATE-003c] ℹ Will use fallback simulation logic")
            agent = None
            use_ai = False
        
        # Get today's date
        today = datetime.now().date()
        today_str = str(today)
        print(f"[SIMULATE-004] ✓ Today's date: {today_str}")
        
        # Get orders to assign to loads
        print("[SIMULATE-005] Querying database for orders...")
        all_orders = client.get_all_orders()
        print(f"[SIMULATE-006] ✓ Retrieved {len(all_orders)} total orders from database")
        
        available_orders = [o for o in all_orders if o.get('status') in ['Pending', 'Assigned']]
        print(f"[SIMULATE-007] ✓ Found {len(available_orders)} available orders (Pending/Assigned)")
        
        if len(available_orders) < 40:
            error_msg = f"Not enough available orders. Need at least 40, found {len(available_orders)}"
            print(f"[SIMULATE-ERROR-008] {error_msg}")
            return jsonify({"error": error_msg, "debug_code": "SIMULATE-ERROR-008"}), 400
        
        # Get existing loads for numbering
        print("[SIMULATE-009] Querying existing loads for numbering...")
        existing_loads = client.get_all_loads()
        print(f"[SIMULATE-010] ✓ Found {len(existing_loads)} existing loads in database")
        
        # Generate simulation plan
        if use_ai:
            print(f"[SIMULATE-011] Requesting AI-generated simulation plan for {today_str}...")
            plan = agent.generate_simulation_plan(available_orders, existing_loads, today_str)
            print(f"[SIMULATE-012] ✓ AI plan received with {len(plan.get('loads', []))} load configurations")
        else:
            print(f"[SIMULATE-011] Generating fallback simulation plan for {today_str}...")
            plan = generate_fallback_simulation_plan(available_orders, existing_loads, today_str)
            print(f"[SIMULATE-012] ✓ Fallback plan created with {len(plan.get('loads', []))} load configurations")
        
        # Execute the plan
        loads_created = []
        orders_used = 0
        
        print(f"[SIMULATE-013] Beginning execution of {len(plan['loads'])} loads...")
        for idx, load_config in enumerate(plan['loads'], 1):
            print(f"\n[SIMULATE-014-{idx}] Processing load {load_config['load_number']}...")
        
            # Get orders for this load
            order_indices = load_config['order_indices']
            orders_in_load = [available_orders[i] for i in order_indices if i < len(available_orders)]
            print(f"[SIMULATE-015-{idx}] Selected {len(orders_in_load)} orders for this load")
            
            if len(orders_in_load) < 5:
                print(f"[SIMULATE-WARN-016-{idx}] Skipping - fewer than 5 orders")
                continue
            
            # Calculate load totals
            total_weight = sum(o.get('weight_lbs', 0) for o in orders_in_load)
            total_volume = sum(o.get('volume_cuft', 0) for o in orders_in_load)
            print(f"[SIMULATE-017-{idx}] Calculated totals - Weight: {total_weight}lbs, Volume: {total_volume}cuft")
            
            # Create the load with AI-generated configuration
            new_load = {
                'load_number': load_config['load_number'],
                'truck_type': load_config['truck_type'],
                'total_weight_lbs': total_weight,
                'total_volume_cuft': total_volume,
                'utilization_percent': round(random.uniform(75, 95), 2),
                'origin': load_config['origin'],
                'status': load_config['status'],
                'estimated_delivery_date': load_config['estimated_delivery_date']
            }
            
            print(f"[SIMULATE-018-{idx}] Inserting load {load_config['load_number']} ({load_config['scenario']}) into database...")
            created_load = client.create_load(new_load)
            print(f"[SIMULATE-019-{idx}] ✓ Load created with ID: {created_load['id']}")
            
            # Update orders with AI-generated configuration
            print(f"[SIMULATE-020-{idx}] Updating {len(orders_in_load)} orders and linking to load...")
            orders_config = load_config['orders_config']
            for order_idx, order in enumerate(orders_in_load, 1):
                try:
                    client.update_order(order['id'], {
                        'status': orders_config['status'],
                        'customer_expected_delivery_date': orders_config['customer_expected_delivery_date'],
                        'delivery_window_start': orders_config['delivery_window_start'],
                        'delivery_window_end': orders_config['delivery_window_end']
                    })
                    
                    # Link to load
                    result = client.create_load_order({
                        'load_id': created_load['id'],
                        'order_id': order['id'],
                        'sequence_number': order_idx
                    })
                    print(f"[SIMULATE-020-{idx}-{order_idx}] ✓ Linked order {order['order_number']} - result: {result}")
                except Exception as link_error:
                    print(f"[SIMULATE-ERROR-020-{idx}-{order_idx}] ❌ Failed to link order {order.get('order_number')}: {str(link_error)}")
                    raise
            print(f"[SIMULATE-021-{idx}] ✓ All orders updated and linked")
            
            loads_created.append({
                'load_number': load_config['load_number'],
                'type': load_config['scenario'],
                'status': load_config['status'],
                'estimated_delivery': load_config['estimated_delivery_date']
            })
            orders_used += len(orders_in_load)
        
        # Prepare response summary
        print(f"\n[SIMULATE-022] All loads processed. Creating response summary...")
        summary = plan.get('summary', {
            'delivered': sum(1 for l in loads_created if l['type'] == 'delivered'),
            'on_time': sum(1 for l in loads_created if l['type'] == 'on-time'),
            'at_risk': sum(1 for l in loads_created if l['type'] == 'at-risk')
        })
        
        print(f"[SIMULATE-023] ✓✓✓ SUCCESS ✓✓✓")
        print(f"[SIMULATE-024] Created {len(loads_created)} loads, assigned {orders_used} orders")
        print(f"[SIMULATE-025] Summary: {summary}")
        print("="*80 + "\n")
        
        return jsonify({
            "message": "Successfully created simulated loads for today using AI agent",
            "date": today_str,
            "loads_created": len(loads_created),
            "orders_assigned": orders_used,
            "loads": loads_created,
            "summary": summary,
            "ai_generated": True,
            "debug_code": "SIMULATE-SUCCESS-025"
        }), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/loads/<load_id>', methods=['GET'])
def get_load_by_id(load_id):
    """Get specific load by ID"""
    from database.supabase_client import SupabaseClient
    try:
        client = SupabaseClient()
        load = client.get_load_by_id(load_id)
        if load:
            return jsonify(load), 200
        else:
            return jsonify({"error": "Load not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Map Visualization API
@app.route('/api/map/load-routes', methods=['POST'])
def get_load_routes_map_data():
    """Get map data for load routes visualization using database facilities"""
    from database.supabase_client import SupabaseClient
    try:
        data = request.json
        load_plan = data.get('load_plan', {})
        
        print(f"[MAP] Received load_plan with {len(load_plan.get('loads', []))} loads")
        
        # Initialize database client
        db = SupabaseClient()
        
        # Get all facilities with coordinates
        facilities = db.get_all_facilities()
        facility_map = {}
        
        # Create lookup maps by city name
        for facility in facilities:
            city = facility['city']
            facility_map[city] = {
                'lat': float(facility['latitude']),
                'lng': float(facility['longitude']),
                'name': facility['facility_name'],
                'type': facility['facility_type']
            }
        
        print(f"[MAP] Loaded {len(facility_map)} facilities from database")
        
        # Build routes data for map
        routes = []
        for load in load_plan.get('loads', []):
            print(f"[MAP] Processing load: {load.get('load_id')}")
            for order in load.get('orders', []):
                origin_str = order.get('origin', '')
                destination_str = order.get('destination', '')
                
                print(f"[MAP] Order {order.get('order_number')}: origin='{origin_str}', dest='{destination_str}'")
                
                # Extract city names from strings
                # Origin format: "Toronto, ON - Toronto DC" -> extract "Toronto"
                # Destination format: "New York, NY" -> extract "New York"
                origin_city = origin_str.split(',')[0].strip() if ',' in origin_str else origin_str.split(' -')[0].strip()
                dest_city = destination_str.split(',')[0].strip() if ',' in destination_str else destination_str.strip()
                
                # Lookup coordinates from database
                origin_coords = facility_map.get(origin_city)
                dest_coords = facility_map.get(dest_city)
                
                print(f"[MAP] Lookup: origin_city='{origin_city}' -> {origin_coords}, dest_city='{dest_city}' -> {dest_coords}")
                
                if origin_coords and dest_coords:
                    routes.append({
                        'load_id': load.get('load_id'),
                        'order_number': order.get('order_number'),
                        'origin': origin_str,
                        'destination': destination_str,
                        'origin_coords': origin_coords,
                        'destination_coords': dest_coords,
                        'weight_lbs': order.get('weight_lbs'),
                        'volume_cuft': order.get('volume_cuft')
                    })
                else:
                    print(f"[MAP] SKIPPED - Missing coordinates for {order.get('order_number')}")
        
        print(f"[MAP] Returning {len(routes)} routes")
        
        return jsonify({
            'routes': routes,
            'summary': {
                'total_routes': len(routes),
                'total_loads': len(load_plan.get('loads', []))
            }
        }), 200
    except Exception as e:
        print(f"[MAP] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# AI Assistant API
@app.route('/api/assistant/chat', methods=['POST'])
def chat_with_assistant():
    """
    Chat with the AI Platform Assistant
    Includes security validation and business appropriateness checks
    """
    from agents.platform_assistant import PlatformAssistant
    
    try:
        data = request.json
        message = data.get('message', '').strip()
        conversation_history = data.get('conversation_history', [])
        
        if not message:
            return jsonify({
                "error": "Message is required",
                "data": {
                    "message": "Please provide a message.",
                    "blocked": True,
                    "warning": "Empty message"
                }
            }), 400
        
        print(f"[AI ASSISTANT] Received message: {message[:100]}...")
        
        # Initialize assistant
        assistant = PlatformAssistant()
        
        # Generate response with security checks
        response = assistant.generate_response(message, conversation_history)
        
        print(f"[AI ASSISTANT] Response generated - blocked: {response.get('blocked')}, reason: {response.get('reason')}")
        
        return jsonify({
            "data": response
        }), 200
        
    except Exception as e:
        print(f"[AI ASSISTANT] ERROR: {str(e)}")
        import traceback
        error_traceback = traceback.format_exc()
        print(error_traceback)
        
        return jsonify({
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": error_traceback.split('\n')[-5:],  # Last 5 lines of traceback
            "data": {
                "message": f"**Error Details:**\n\n**Type:** {type(e).__name__}\n**Message:** {str(e)}\n\nPlease check the backend logs for full details.",
                "blocked": False,
                "warning": "system_error",
                "reason": "exception"
            }
        }), 500

# mertsightsAI RAG API
@app.route('/api/mertsights/query', methods=['POST'])
def mertsights_query():
    """
    mertsightsAI - Conversational analytics with RAG
    Converts natural language questions to SQL queries and returns visualizations
    """
    from agents.mertsights_ai import MertsightsAI
    from database.supabase_client import SupabaseClient
    
    try:
        data = request.json
        question = data.get('question', '').strip()
        conversation_history = data.get('conversation_history', [])
        
        if not question:
            return jsonify({
                "success": False,
                "error": "Question is required"
            }), 400
        
        print(f"[MERTSIGHTS] Received question: {question}")
        
        # Initialize RAG agent
        client = SupabaseClient()
        mertsights = MertsightsAI(client)
        
        # Analyze query and generate response
        result = mertsights.analyze_query(question, conversation_history)
        
        if result.get("success"):
            print(f"[MERTSIGHTS] Success - returned {len(result.get('data', []))} rows")
        else:
            print(f"[MERTSIGHTS] Failed - {result.get('error')}")
        
        return jsonify(result), 200 if result.get("success") else 400
        
    except Exception as e:
        error_msg = str(e)
        print(f"[MERTSIGHTS] ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        
        # Provide more helpful error messages
        if "GEMINI_API_KEY" in error_msg:
            error_msg = "Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
        elif "API key" in error_msg or "authentication" in error_msg.lower():
            error_msg = "Invalid Gemini API key. Please check your API key configuration."
        
        return jsonify({
            "success": False,
            "error": f"mertsightsAI error: {error_msg}"
        }), 500

# AI Docuscan - Document OCR and Classification
@app.route('/api/docuscan/analyze', methods=['POST'])
def analyze_document():
    """
    Analyze uploaded document using Gemini Vision for OCR and classification.
    Two-stage process:
    1. Extract text and make initial classification
    2. Verify classification and extract document-specific fields
    """
    import google.generativeai as genai
    import os
    from werkzeug.utils import secure_filename
    import base64
    from PIL import Image
    import io
    
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Validate file type
        allowed_extensions = {'pdf', 'png', 'jpg', 'jpeg'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: PDF, PNG, JPG, JPEG'}), 400
        
        # Read file into memory
        file_bytes = file.read()
        
        # Configure Gemini
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Document classification options
        document_types = [
            'Bill of Lading',
            'Signed Bill of Lading',
            'Commercial Invoice',
            'Packing List',
            'Carrier Invoice',
            'Communication Records'
        ]
        
        # Stage 1: Initial OCR and Classification
        print("[Docuscan] Stage 1: Extracting text and initial classification...")
        
        # Prepare image for Gemini
        if file_ext == 'pdf':
            # For PDFs, we'll use the first page (Gemini supports PDF)
            image_parts = [{
                'mime_type': 'application/pdf',
                'data': file_bytes
            }]
        else:
            # For images
            image_parts = [{
                'mime_type': f'image/{file_ext}',
                'data': file_bytes
            }]
        
        stage1_prompt = f"""Analyze this document image and perform two tasks:

1. EXTRACT ALL TEXT: Extract every piece of text visible in the document. Include headers, labels, values, dates, numbers, addresses, signatures, stamps - everything readable.

2. CLASSIFY DOCUMENT: Based on the extracted text, classify this document into ONE of these categories:
{chr(10).join(f'   - {doc_type}' for doc_type in document_types)}

Respond in this EXACT JSON format:
{{
    "raw_text": "Complete extracted text from the document",
    "initial_classification": "One of the document types listed above",
    "confidence": 85,
    "reasoning": "Brief explanation of why you classified it this way"
}}"""

        response1 = model.generate_content([stage1_prompt] + image_parts)
        stage1_result = response1.text
        
        # Parse Stage 1 response
        import json
        import re
        
        # Extract JSON from markdown code blocks if present
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', stage1_result, re.DOTALL)
        if json_match:
            stage1_data = json.loads(json_match.group(1))
        else:
            # Try to parse as direct JSON
            stage1_data = json.loads(stage1_result)
        
        raw_text = stage1_data.get('raw_text', '')
        initial_classification = stage1_data.get('initial_classification', '')
        confidence = stage1_data.get('confidence', 0)
        reasoning = stage1_data.get('reasoning', '')
        
        print(f"[Docuscan] Initial classification: {initial_classification} ({confidence}% confidence)")
        
        # Stage 2: Verification and Field Extraction
        print("[Docuscan] Stage 2: Verifying classification and extracting structured fields...")
        
        # Define document-specific fields to extract
        field_templates = {
            'Bill of Lading': {
                'bol_number': 'Bill of Lading number',
                'carrier': 'Carrier name',
                'shipper': 'Shipper name and address',
                'consignee': 'Consignee name and address',
                'origin': 'Origin location',
                'destination': 'Destination location',
                'date': 'Date of shipment',
                'weight': 'Total weight',
                'pieces': 'Number of pieces/packages',
                'description': 'Goods description'
            },
            'Signed Bill of Lading': {
                'bol_number': 'Bill of Lading number',
                'carrier': 'Carrier name',
                'shipper': 'Shipper name and address',
                'consignee': 'Consignee name and address',
                'origin': 'Origin location',
                'destination': 'Destination location',
                'date': 'Date of shipment',
                'weight': 'Total weight',
                'signature': 'Signature present (Yes/No)',
                'signed_by': 'Name of signatory',
                'signature_date': 'Date of signature'
            },
            'Commercial Invoice': {
                'invoice_number': 'Invoice number',
                'invoice_date': 'Invoice date',
                'seller': 'Seller/Exporter name and address',
                'buyer': 'Buyer/Importer name and address',
                'total_amount': 'Total invoice amount',
                'currency': 'Currency',
                'payment_terms': 'Payment terms',
                'items': 'List of items/products',
                'quantities': 'Quantities',
                'unit_prices': 'Unit prices'
            },
            'Packing List': {
                'packing_list_number': 'Packing list number',
                'date': 'Date',
                'shipper': 'Shipper name',
                'consignee': 'Consignee name',
                'total_packages': 'Total number of packages',
                'total_weight': 'Total weight',
                'total_volume': 'Total volume',
                'items': 'List of items',
                'package_numbers': 'Package/carton numbers',
                'dimensions': 'Package dimensions'
            },
            'Carrier Invoice': {
                'invoice_number': 'Carrier invoice number',
                'invoice_date': 'Invoice date',
                'carrier_name': 'Carrier company name',
                'customer_name': 'Customer/Shipper name',
                'shipment_reference': 'Shipment or BOL reference',
                'service_date': 'Service date',
                'origin': 'Origin location',
                'destination': 'Destination location',
                'charges': 'Breakdown of charges',
                'total_amount': 'Total amount due',
                'payment_terms': 'Payment terms'
            },
            'Communication Records': {
                'date': 'Date of communication',
                'sender': 'Sender name/email',
                'recipient': 'Recipient name/email',
                'subject': 'Subject line',
                'reference_number': 'Any reference numbers mentioned',
                'key_points': 'Main points discussed',
                'action_items': 'Action items or follow-ups',
                'attachments': 'Any attachments mentioned'
            }
        }
        
        fields_to_extract = field_templates.get(initial_classification, {})
        
        stage2_prompt = f"""You previously classified this document as: {initial_classification}

Now perform two tasks:

1. VERIFY CLASSIFICATION: Review the document again carefully. Is "{initial_classification}" still the best match from this list?
{chr(10).join(f'   - {doc_type}' for doc_type in document_types)}

2. EXTRACT STRUCTURED FIELDS: If the classification is correct, extract these specific fields from the document:
{chr(10).join(f'   - {field}: {description}' for field, description in fields_to_extract.items())}

For each field:
- Extract the EXACT value from the document if present
- If not found or not visible, return "Not found"
- Be precise with numbers, dates, and names

Respond in this EXACT JSON format:
{{
    "final_classification": "Confirmed document type",
    "confidence": 90,
    "verification_notes": "Brief note on verification (e.g., 'Confirmed based on presence of BOL number and carrier details' or 'Changed from X to Y because...')",
    "extracted_fields": {{
        "field_name": "extracted value or 'Not found'"
    }}
}}"""

        response2 = model.generate_content([stage2_prompt] + image_parts)
        stage2_result = response2.text
        
        # Parse Stage 2 response
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', stage2_result, re.DOTALL)
        if json_match:
            stage2_data = json.loads(json_match.group(1))
        else:
            stage2_data = json.loads(stage2_result)
        
        final_classification = stage2_data.get('final_classification', initial_classification)
        final_confidence = stage2_data.get('confidence', confidence)
        verification_notes = stage2_data.get('verification_notes', '')
        extracted_fields = stage2_data.get('extracted_fields', {})
        
        print(f"[Docuscan] Final classification: {final_classification} ({final_confidence}% confidence)")
        print(f"[Docuscan] Extracted {len(extracted_fields)} fields")
        
        # Return comprehensive results
        return jsonify({
            'classification': final_classification,
            'confidence': final_confidence,
            'verification_notes': verification_notes,
            'extracted_data': extracted_fields,
            'raw_text': raw_text,
            'processing_stages': {
                'stage1_classification': initial_classification,
                'stage1_confidence': confidence,
                'stage1_reasoning': reasoning,
                'stage2_classification': final_classification,
                'stage2_confidence': final_confidence
            }
        }), 200
        
    except json.JSONDecodeError as e:
        print(f"[Docuscan] JSON parsing error: {str(e)}")
        return jsonify({
            'error': 'Failed to parse AI response',
            'details': str(e)
        }), 500
    except Exception as e:
        print(f"[Docuscan] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Document analysis failed',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    print(f"[merTM.S] Backend starting on port {PORT}...")
    print(f"[API] Available at: http://localhost:{PORT}")
    print(f"[HEALTH] Check endpoint: http://localhost:{PORT}/health")
    
    # Initialize Supabase keep-alive on startup
    try:
        initialize_keep_alive()
    except Exception as e:
        print(f"[KEEP-ALIVE] Warning: Failed to initialize keep-alive: {e}")
        print(f"[KEEP-ALIVE] Continuing with app startup...")
    
    # Disable debug mode to prevent watchdog crashes
    app.run(debug=False, port=PORT, host='0.0.0.0', use_reloader=False)

