import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_tables():
    """
    Check what tables exist in the database
    """
    print("🔍 Checking Database Tables")
    print("=" * 40)
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    # Remove any trailing characters
    if supabase_key and supabase_key.endswith('%'):
        supabase_key = supabase_key[:-1]
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    # Check what tables exist by trying to access the information_schema
    # This is a PostgreSQL system table that should be accessible
    try:
        # Try to get table information
        tables_url = f"{supabase_url}/rest/v1/rpc/get_tables"
        
        # Alternative: try to access a system view
        system_url = f"{supabase_url}/rest/v1/information_schema.tables"
        
        response = requests.get(system_url, headers=headers)
        print(f"📊 System Tables Access: {response.status_code}")
        
        if response.status_code == 200:
            tables = response.json()
            print(f"📋 Found {len(tables)} tables:")
            for table in tables:
                schema = table.get('table_schema', 'unknown')
                name = table.get('table_name', 'unknown')
                print(f"  - {schema}.{name}")
        else:
            print(f"❌ System tables error: {response.text}")
            
    except Exception as e:
        print(f"❌ System tables check failed: {e}")
    
    # Try to access some common Supabase tables
    common_tables = ['products', 'auth.users', 'public.products', 'test_products']
    
    for table_name in common_tables:
        try:
            table_url = f"{supabase_url}/rest/v1/{table_name}"
            response = requests.get(table_url, headers=headers)
            print(f"📋 {table_name}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Found {len(data)} records")
        except Exception as e:
            print(f"❌ {table_name}: {e}")

if __name__ == "__main__":
    check_tables() 