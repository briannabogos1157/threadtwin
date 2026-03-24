import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase():
    """
    Test Supabase connection and provide troubleshooting info
    """
    print("🔍 Supabase Connection Test")
    print("=" * 40)
    
    # Check environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    print(f"📋 Supabase URL: {supabase_url}")
    print(f"📋 Supabase Key: {supabase_key[:20]}..." if supabase_key else "❌ Missing")
    
    if not supabase_url or not supabase_key:
        print("\n❌ Missing environment variables!")
        print("Please check your .env file contains:")
        print("SUPABASE_URL=your-project-url")
        print("SUPABASE_ANON_KEY=your-anon-key")
        return
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        print("\n✅ Supabase client created successfully")
        
        # Try to list tables (this might work even if products table doesn't exist)
        try:
            print("\n🔍 Testing basic connection...")
            # Try a simple query that doesn't require a specific table
            result = supabase.from_('information_schema.tables').select('table_name').eq('table_schema', 'public').execute()
            print("✅ Basic connection successful!")
            
            # Check if products table exists
            tables = [row['table_name'] for row in result.data]
            if 'products' in tables:
                print("✅ Products table exists!")
                
                # Try to query the products table
                try:
                    result = supabase.table('products').select('*').limit(1).execute()
                    print("✅ Can query products table!")
                    print(f"📊 Table has {len(result.data)} rows")
                except Exception as table_error:
                    print(f"❌ Cannot query products table: {table_error}")
                    print("\n🔧 This usually means Row Level Security (RLS) is enabled.")
                    print("To fix this:")
                    print("1. Go to your Supabase dashboard")
                    print("2. Navigate to Authentication > Policies")
                    print("3. Find the 'products' table")
                    print("4. Click 'New Policy' and create a policy that allows all operations")
                    print("   OR disable RLS entirely for testing")
            else:
                print("❌ Products table does not exist!")
                print("\n🔧 To create the table:")
                print("1. Go to your Supabase dashboard")
                print("2. Navigate to SQL Editor")
                print("3. Run the SQL from create_products_table.sql")
                
        except Exception as schema_error:
            print(f"❌ Schema access error: {schema_error}")
            print("\n🔧 This suggests a permissions issue. Please check:")
            print("1. That you're using the correct anon key (not service role key)")
            print("2. That your project is active and not paused")
            print("3. That you have the correct permissions")
            
    except Exception as e:
        print(f"❌ Failed to create Supabase client: {e}")
        print("\n🔧 Please check:")
        print("1. Your Supabase URL is correct")
        print("2. Your anon key is correct")
        print("3. Your project is active")

if __name__ == "__main__":
    test_supabase() 