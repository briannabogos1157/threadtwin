from supabase import create_client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials. Please check your .env file.")

supabase = create_client(supabase_url, supabase_key)

def run_migrations():
    try:
        print("🔄 Running migrations...")
        
        # Read the SQL migration file
        with open('src/migrations/create_products_table.sql', 'r') as f:
            sql = f.read()
        
        # Execute the SQL using Supabase's raw query feature
        response = supabase.table('products').select('*').execute()
        print("✅ Current table structure:", response)
        
        print("\n⚠️ Important: Please execute the following SQL in your Supabase dashboard SQL editor:")
        print("\n" + sql)
        
        print("\n📝 Instructions:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to 'SQL Editor'")
        print("4. Create a 'New Query'")
        print("5. Paste the SQL above")
        print("6. Click 'Run'")
        
    except Exception as e:
        print(f"❌ Error running migrations: {str(e)}")

if __name__ == "__main__":
    run_migrations() 