"""
Quick script to create the products table in Supabase
"""
from database.supabase_client import SupabaseClient

def create_products_table():
    client = SupabaseClient()
    
    # SQL to create products table
    create_table_sql = """
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
    """
    
    # Create index
    index_sql = "CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);"
    
    # Enable RLS
    rls_sql = "ALTER TABLE products ENABLE ROW LEVEL SECURITY;"
    
    # Create policy
    policy_sql = """
    DROP POLICY IF EXISTS "Allow all operations on products" ON products;
    CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
    """
    
    try:
        print("Creating products table...")
        client.client.rpc('exec_sql', {'query': create_table_sql}).execute()
        print("✓ Products table created")
        
        print("Creating index...")
        client.client.rpc('exec_sql', {'query': index_sql}).execute()
        print("✓ Index created")
        
        print("Enabling RLS...")
        client.client.rpc('exec_sql', {'query': rls_sql}).execute()
        print("✓ RLS enabled")
        
        print("Creating policy...")
        client.client.rpc('exec_sql', {'query': policy_sql}).execute()
        print("✓ Policy created")
        
        print("\nAll done! Products table is ready.")
        
    except Exception as e:
        print(f"Note: {str(e)}")
        print("\nPlease run the following SQL directly in Supabase SQL Editor:")
        print("=" * 80)
        print(create_table_sql)
        print(index_sql)
        print(rls_sql)
        print(policy_sql)
        print("=" * 80)

if __name__ == '__main__':
    create_products_table()
