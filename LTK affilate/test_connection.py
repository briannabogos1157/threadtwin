from supabase_client import supabase

def test_supabase_connection():
    try:
        # Try to fetch a single row from the products table
        response = supabase.table("products").select("*").limit(1).execute()
        print("✅ Successfully connected to Supabase!")
        print(f"🔍 Database response: {response}")
        return True
    except Exception as e:
        print("❌ Failed to connect to Supabase")
        print(f"Error details: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔌 Testing Supabase connection...")
    test_supabase_connection() 