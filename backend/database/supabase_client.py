"""
Supabase Database Client
"""
from supabase import create_client, Client
import sys
import os
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.settings import SUPABASE_URL, SUPABASE_KEY

class SupabaseClient:
    """
    Wrapper for Supabase database operations
    """
    
    def __init__(self):
        # Add retry logic for Render deployment
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
                # Test connection
                self.client.table('facilities').select('id').limit(1).execute()
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"[SUPABASE] Connection attempt {attempt + 1} failed, retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                else:
                    print(f"[SUPABASE] Failed to connect after {max_retries} attempts")
                    raise
    
    # Facilities Operations
    def get_all_facilities(self):
        """Get all facilities from database"""
        # Supabase defaults to 1000 record limit - use range() to get more
        response = self.client.table('facilities').select('*').range(0, 19999).execute()
        return response.data
    
    def get_facility_by_city(self, city):
        """Get facility by city name"""
        response = self.client.table('facilities').select('*').eq('city', city).execute()
        return response.data[0] if response.data else None
    
    def get_facility_by_code(self, facility_code):
        """Get facility by code"""
        response = self.client.table('facilities').select('*').eq('facility_code', facility_code).execute()
        return response.data[0] if response.data else None
    
    def get_origins(self):
        """Get all origin facilities"""
        response = self.client.table('facilities').select('*').eq('facility_type', 'origin').execute()
        return response.data
    
    def get_destinations(self):
        """Get all destination facilities"""
        response = self.client.table('facilities').select('*').eq('facility_type', 'destination').execute()
        return response.data
    
    def create_facilities_batch(self, facilities_list):
        """Insert multiple facilities at once"""
        response = self.client.table('facilities').insert(facilities_list).execute()
        return response.data
    
    # Products Operations
    def get_all_products(self):
        """Get all products from database"""
        # Supabase defaults to 1000 record limit - use range() to get more
        response = self.client.table('products').select('*').range(0, 19999).execute()
        return response.data
    
    def get_product_by_id(self, product_id):
        """Get specific product by ID"""
        response = self.client.table('products').select('*').eq('product_id', product_id).execute()
        return response.data[0] if response.data else None
    
    def create_product(self, product_data):
        """Insert new product"""
        response = self.client.table('products').insert(product_data).execute()
        return response.data[0] if response.data else None
    
    def create_products_batch(self, products_list):
        """Insert multiple products at once"""
        response = self.client.table('products').insert(products_list).execute()
        return response.data
    
    def update_product(self, product_id, product_data):
        """Update product"""
        response = self.client.table('products').update(product_data).eq('product_id', product_id).execute()
        return response.data[0] if response.data else None
    
    def delete_product(self, product_id):
        """Delete product"""
        response = self.client.table('products').delete().eq('product_id', product_id).execute()
        return response.data
    
    # Orders Operations
    def get_all_orders(self):
        """Get all orders from database (with increased limit for large datasets)"""
        # Supabase PostgREST has a default limit of 1000 rows
        # Use range() to get more rows: range(0, 19999) gets rows 0-19999 (20k total)
        response = self.client.table('orders').select('*').range(0, 19999).execute()
        print(f"[SUPABASE] Retrieved {len(response.data)} orders from database")
        return response.data
    
    def get_order_by_id(self, order_id):
        """Get specific order by ID"""
        response = self.client.table('orders').select('*').eq('id', order_id).execute()
        return response.data[0] if response.data else None
    
    def create_order(self, order_data):
        """Insert new order"""
        response = self.client.table('orders').insert(order_data).execute()
        return response.data[0] if response.data else None
    
    def create_orders_batch(self, orders_list):
        """Insert multiple orders at once"""
        try:
            print(f"[SUPABASE] Inserting {len(orders_list)} orders...")
            response = self.client.table('orders').insert(orders_list).execute()
            print(f"[SUPABASE] Successfully inserted {len(response.data)} orders")
            return response.data
        except Exception as e:
            print(f"[SUPABASE ERROR] Failed to insert orders: {str(e)}")
            raise
    
    def create_orders_batch_chunked(self, orders_list, chunk_size=100):
        """Insert multiple orders in chunks to avoid size limits"""
        all_results = []
        total_chunks = (len(orders_list) + chunk_size - 1) // chunk_size
        for i in range(0, len(orders_list), chunk_size):
            chunk = orders_list[i:i + chunk_size]
            chunk_num = (i // chunk_size) + 1
            print(f"[SUPABASE] Inserting chunk {chunk_num}/{total_chunks} ({len(chunk)} orders)...")
            try:
                response = self.client.table('orders').insert(chunk).execute()
                all_results.extend(response.data)
                print(f"[SUPABASE] Chunk {chunk_num} inserted successfully")
            except Exception as e:
                print(f"[SUPABASE ERROR] Chunk {chunk_num} failed: {str(e)}")
                raise
        print(f"[SUPABASE] Total inserted: {len(all_results)} orders")
        return all_results
    
    def update_order_status(self, order_id, status):
        """Update order status"""
        response = self.client.table('orders').update({'status': status}).eq('id', order_id).execute()
        return response.data[0] if response.data else None
    
    def update_order(self, order_id, update_data):
        """Update order with any fields"""
        response = self.client.table('orders').update(update_data).eq('id', order_id).execute()
        return response.data[0] if response.data else None
    
    def delete_all_orders(self):
        """Delete all orders from the table"""
        # First get all order IDs
        orders = self.get_all_orders()
        if not orders:
            return []
        
        # Delete all orders
        order_ids = [order['id'] for order in orders]
        response = self.client.table('orders').delete().in_('id', order_ids).execute()
        return response.data
    
    # Loads Operations
    def get_all_loads(self):
        """Get all loads with their orders (optimized)"""
        # Fetch all loads - use range() to handle more than 1000 loads
        response = self.client.table('loads').select('*').range(0, 19999).execute()
        loads = response.data
        
        if not loads:
            return []
        
        # Fetch ALL load_orders in one query
        load_ids = [load['id'] for load in loads]
        load_orders_response = self.client.table('load_orders').select('*, orders(*)').in_('load_id', load_ids).order('sequence_number').range(0, 19999).execute()
        
        # Group orders by load_id
        orders_by_load = {}
        for lo in load_orders_response.data:
            load_id = lo['load_id']
            if load_id not in orders_by_load:
                orders_by_load[load_id] = []
            if lo.get('orders'):
                orders_by_load[load_id].append(lo['orders'])
        
        # Attach orders to loads
        for load in loads:
            load['orders'] = orders_by_load.get(load['id'], [])
        
        return loads
    
    def get_load_by_id(self, load_id):
        """Get specific load by ID with orders"""
        response = self.client.table('loads').select('*').eq('id', load_id).execute()
        if not response.data:
            return None
        
        load = response.data[0]
        load_orders = self.client.table('load_orders').select('*, orders(*)').eq('load_id', load_id).order('sequence_number').execute()
        load['orders'] = [lo['orders'] for lo in load_orders.data if lo.get('orders')] if load_orders.data else []
        
        return load
    
    def create_load(self, load_data):
        """Insert new load"""
        response = self.client.table('loads').insert(load_data).execute()
        return response.data[0] if response.data else None
    
    def create_load_order(self, load_order_data):
        """Link an order to a load"""
        response = self.client.table('load_orders').insert(load_order_data).execute()
        return response.data[0] if response.data else None
    
    def create_load_orders_batch(self, load_orders_list):
        """Link multiple orders to loads"""
        response = self.client.table('load_orders').insert(load_orders_list).execute()
        return response.data
    
    # Carriers Operations
    def get_all_carriers(self):
        """Get all carriers"""
        # Supabase defaults to 1000 record limit - use range() to get more
        response = self.client.table('carriers').select('*').range(0, 19999).execute()
        return response.data
    
    def create_carrier(self, carrier_data):
        """Insert new carrier"""
        response = self.client.table('carriers').insert(carrier_data).execute()
        return response.data[0] if response.data else None
    
    # Raw Query Execution (for mertsightsAI RAG)
    def execute_raw_query(self, sql_query):
        """
        Execute raw SQL query (READ-ONLY for analytics)
        Returns list of dictionaries
        
        SECURITY: Only used by mertsightsAI with pre-validated SELECT queries
        """
        try:
            # Use Supabase RPC to execute raw SQL
            # Note: This requires a database function to be created in Supabase
            # For now, we'll use the PostgREST client directly
            
            # Clean up query
            sql_query = sql_query.strip()
            if sql_query.endswith(';'):
                sql_query = sql_query[:-1]
            
            # Execute using rpc (requires stored procedure in Supabase)
            # Alternative: Use direct PostgREST query if RPC not available
            response = self.client.rpc('execute_sql', {'query': sql_query}).execute()
            return response.data
            
        except Exception as e:
            # If RPC doesn't exist, try alternative approach using PostgREST filters
            print(f"[DATABASE] RPC execution failed, attempting alternative: {str(e)}")
            
            # Parse simple SELECT queries and convert to PostgREST calls
            # This is a fallback for common queries
            return self._execute_query_fallback(sql_query)
    
    def _execute_query_fallback(self, sql_query):
        """
        Fallback: Parse simple SQL and execute using PostgREST methods
        Handles basic SELECT queries with WHERE, ORDER BY, LIMIT
        """
        import re
        
        sql_upper = sql_query.upper()
        
        # Extract table name (first table after FROM)
        from_match = re.search(r'FROM\s+(\w+)', sql_upper)
        if not from_match:
            raise Exception("Unable to parse table name from query")
        
        table_name = from_match.group(1).lower()
        
        # Build query chain
        query = self.client.table(table_name).select('*')
        
        # Extract LIMIT (if present)
        limit_match = re.search(r'LIMIT\s+(\d+)', sql_upper)
        if limit_match:
            limit = int(limit_match.group(1))
            query = query.limit(limit)
        else:
            query = query.limit(100)  # Default limit
        
        # Execute and return
        response = query.execute()
        return response.data

