import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def debug_table_access():
    """
    Debug table access issues
    """
    print("🔍 Debugging Table Access")
    print("=" * 40)
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    # Remove any trailing characters
    if service_key and service_key.endswith('%'):
        service_key = service_key[:-1]
    
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json'
    }
    
    # Test 1: Try to access the table with different approaches
    test_urls = [
        f"{supabase_url}/rest/v1/products",
        f"{supabase_url}/rest/v1/public.products",
        f"{supabase_url}/rest/v1/products?select=*",
        f"{supabase_url}/rest/v1/products?select=id",
    ]
    
    for url in test_urls:
        try:
            response = requests.get(url, headers=headers)
            print(f"📋 {url}")
            print(f"   Status: {response.status_code}")
            if response.status_code != 200:
                print(f"   Error: {response.text}")
            else:
                data = response.json()
                print(f"   Success: {len(data)} records")
            print()
        except Exception as e:
            print(f"📋 {url}")
            print(f"   Exception: {e}")
            print()
    
    # Test 2: Try to insert a test record
    print("🔍 Testing Insert")
    test_record = {
        "brand": "Test Brand",
        "name": "Test Product",
        "price": "99.99",
        "url": "https://example.com",
        "category": "test",
        "source": "test",
        "affiliate_link": "https://example.com"
    }
    
    try:
        insert_url = f"{supabase_url}/rest/v1/products"
        response = requests.post(insert_url, headers=headers, json=test_record)
        print(f"📋 Insert Test: {response.status_code}")
        if response.status_code == 201:
            print("✅ Successfully inserted test record!")
            result = response.json()
            print(f"   Inserted ID: {result.get('id', 'N/A')}")
            
            # Clean up - delete the test record
            if 'id' in result:
                delete_url = f"{insert_url}?id=eq.{result['id']}"
                delete_response = requests.delete(delete_url, headers=headers)
                print(f"🧹 Cleaned up: {delete_response.status_code}")
        else:
            print(f"❌ Insert failed: {response.text}")
    except Exception as e:
        print(f"❌ Insert test failed: {e}")

if __name__ == "__main__":
    debug_table_access() 