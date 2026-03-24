import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_single_upload():
    """
    Test uploading a single record to Supabase
    """
    print("🧪 Testing Single Record Upload")
    print("=" * 40)
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing environment variables!")
        return
    
    # Test data
    test_record = {
        "brand": "Test Brand",
        "name": "Test Product",
        "price": "99.99",
        "url": "https://example.com",
        "category": "test",
        "source": "test",
        "affiliate_link": "https://example.com"
    }
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    # Try to insert a single record
    insert_url = f"{supabase_url}/rest/v1/products"
    
    try:
        print(f"🔗 Attempting to insert: {test_record['name']}")
        response = requests.post(insert_url, headers=headers, json=test_record)
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📊 Response headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("✅ Single record uploaded successfully!")
            return True
        else:
            print(f"❌ Upload failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_service_role():
    """
    Test if we can get the service role key from the user
    """
    print("\n🔑 Service Role Key Test")
    print("=" * 30)
    print("The anon key might not have insert permissions.")
    print("Please check your Supabase dashboard:")
    print("1. Go to Settings > API")
    print("2. Copy the 'service_role' key (not anon key)")
    print("3. Update your .env file with:")
    print("   SUPABASE_SERVICE_KEY=your-service-role-key")
    print("\n⚠️  Note: Service role key has full access - keep it secure!")

if __name__ == "__main__":
    success = test_single_upload()
    
    if not success:
        test_service_role() 