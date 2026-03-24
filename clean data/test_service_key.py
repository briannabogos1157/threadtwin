import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_service_key():
    """
    Test the service role key and check table existence
    """
    print("🔍 Testing Service Role Key")
    print("=" * 40)
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    # Remove any trailing characters that might be causing issues
    if supabase_key and supabase_key.endswith('%'):
        supabase_key = supabase_key[:-1]
    
    print(f"📋 Supabase URL: {supabase_url}")
    print(f"📋 Service Key: {supabase_key[:20]}..." if supabase_key else "❌ Missing")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing environment variables!")
        return
    
    # Test the REST API with service role key
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    # Test 1: Check if we can access the API
    test_url = f"{supabase_url}/rest/v1/"
    try:
        response = requests.get(test_url, headers=headers)
        print(f"✅ API Access: {response.status_code}")
    except Exception as e:
        print(f"❌ API Access Failed: {e}")
        return
    
    # Test 2: Check if products table exists
    products_url = f"{supabase_url}/rest/v1/products"
    try:
        response = requests.get(products_url, headers=headers)
        print(f"✅ Products Table Access: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Found {len(data)} existing products")
        else:
            print(f"❌ Products table error: {response.text}")
    except Exception as e:
        print(f"❌ Products Table Access Failed: {e}")
    
    # Test 3: Try to insert a single test record
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
        response = requests.post(products_url, headers=headers, json=test_record)
        print(f"✅ Test Insert: {response.status_code}")
        if response.status_code == 201:
            print("🎉 Successfully inserted test record!")
            # Clean up - delete the test record
            result = response.json()
            if 'id' in result:
                delete_url = f"{products_url}?id=eq.{result['id']}"
                delete_response = requests.delete(delete_url, headers=headers)
                print(f"🧹 Cleaned up test record: {delete_response.status_code}")
        else:
            print(f"❌ Insert failed: {response.text}")
    except Exception as e:
        print(f"❌ Insert test failed: {e}")

if __name__ == "__main__":
    test_service_key() 