import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_simple_upload():
    """
    Test a simple upload to see if we can get more specific error info
    """
    print("🧪 Simple Upload Test")
    print("=" * 30)
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    # Remove any trailing characters
    if service_key and service_key.endswith('%'):
        service_key = service_key[:-1]
    
    print(f"📋 URL: {supabase_url}")
    print(f"📋 Service Key: {service_key[:20]}..." if service_key else "❌ Missing")
    
    if not service_key:
        print("❌ Service key is missing!")
        return
    
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    # Simple test record
    test_record = {
        "brand": "Test Brand",
        "name": "Test Product",
        "price": "99.99",
        "url": "https://example.com",
        "category": "test",
        "source": "test",
        "affiliate_link": "https://example.com",
        "title": "Test Product Title"
    }
    
    # Try to insert
    try:
        url = f"{supabase_url}/rest/v1/products"
        print(f"🔗 Trying to insert to: {url}")
        
        response = requests.post(url, headers=headers, json=test_record)
        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("🎉 Success! Record inserted!")
            result = response.json()
            print(f"📋 Inserted ID: {result.get('id', 'N/A')}")
        else:
            print(f"❌ Error: {response.text}")
            
            # Try to get more info
            if response.status_code == 403:
                print("\n🔍 403 Error Details:")
                print("This usually means:")
                print("1. Table doesn't exist")
                print("2. Service role doesn't have permissions")
                print("3. Row Level Security is blocking access")
                
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_simple_upload() 