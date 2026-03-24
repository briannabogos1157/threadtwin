import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_rest():
    """
    Test Supabase using direct REST API calls
    """
    print("🔍 Simple Supabase REST Test")
    print("=" * 30)
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing environment variables!")
        return
    
    # Test the REST API directly
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    # Test endpoint
    test_url = f"{supabase_url}/rest/v1/"
    
    try:
        print(f"🔗 Testing connection to: {test_url}")
        response = requests.get(test_url, headers=headers)
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📊 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ REST API connection successful!")
        else:
            print(f"❌ REST API error: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    test_supabase_rest() 