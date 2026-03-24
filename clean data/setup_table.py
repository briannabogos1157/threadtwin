import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_table():
    """
    Create the products table in Supabase with the correct schema
    """
    try:
        # Supabase configuration
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase credentials!")
            return False
        
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # SQL to create the table with all required columns
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            brand VARCHAR(255),
            name TEXT,
            fabric TEXT,
            price VARCHAR(50),
            url TEXT,
            image TEXT,
            category VARCHAR(255),
            source VARCHAR(255),
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            title TEXT,
            image_url TEXT,
            color VARCHAR(255),
            affiliate_link TEXT
        );
        """
        
        # SQL to disable RLS for testing
        disable_rls_sql = """
        ALTER TABLE products DISABLE ROW LEVEL SECURITY;
        """
        
        print("🔨 Creating products table in Supabase...")
        
        # Try to create the table using RPC (if available)
        try:
            result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
            print("✅ Table created successfully using RPC!")
        except Exception as rpc_error:
            print(f"RPC method failed: {rpc_error}")
            print("⚠️  You may need to create the table manually in the Supabase dashboard")
            print("📋 Use this SQL in your Supabase SQL Editor:")
            print(create_table_sql)
            return False
        
        # Try to disable RLS
        try:
            result = supabase.rpc('exec_sql', {'sql': disable_rls_sql}).execute()
            print("✅ Row Level Security disabled!")
        except Exception as rls_error:
            print(f"Could not disable RLS: {rls_error}")
            print("⚠️  You may need to disable RLS manually in the Supabase dashboard")
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up table: {e}")
        print("\n📋 Manual Setup Instructions:")
        print("1. Go to your Supabase dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Run this SQL:")
        print(create_table_sql)
        print("4. Then run this SQL to disable RLS:")
        print(disable_rls_sql)
        return False

def test_table_access():
    """
    Test if we can access the products table
    """
    try:
        # Supabase configuration
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase credentials!")
            return False
        
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Try to query the table
        result = supabase.table('products').select('*').limit(1).execute()
        print("✅ Table access successful!")
        return True
        
    except Exception as e:
        print(f"❌ Table access failed: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Supabase Table Setup")
    print("=" * 30)
    
    # Try to set up the table
    if setup_table():
        print("\n🔍 Testing table access...")
        if test_table_access():
            print("\n✅ Table setup complete! You can now upload data.")
        else:
            print("\n❌ Table access still failing. Please check:")
            print("1. That the table was created successfully")
            print("2. That Row Level Security is disabled")
            print("3. Your Supabase credentials")
    else:
        print("\n❌ Table setup failed. Please follow the manual instructions above.") 