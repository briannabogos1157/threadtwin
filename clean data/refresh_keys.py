import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def refresh_and_test_keys():
    """
    Test and refresh Supabase keys
    """
    print("🔑 Testing Supabase Keys")
    print("=" * 40)
    
    supabase_url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    print(f"📋 Supabase URL: {supabase_url}")
    print(f"📋 Anon Key: {anon_key[:20]}..." if anon_key else "❌ Missing")
    print(f"📋 Service Key: {service_key[:20]}..." if service_key else "❌ Missing")
    
    # Test basic API connectivity
    print("\n🔍 Testing Basic API Connectivity")
    
    # Test 1: Health check endpoint
    try:
        health_url = f"{supabase_url}/rest/v1/"
        response = requests.get(health_url)
        print(f"✅ Health Check: {response.status_code}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
    
    # Test 2: With anon key
    if anon_key:
        headers = {
            'apikey': anon_key,
            'Authorization': f'Bearer {anon_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(health_url, headers=headers)
            print(f"✅ Anon Key Health: {response.status_code}")
        except Exception as e:
            print(f"❌ Anon Key Health Failed: {e}")
    
    # Test 3: With service key
    if service_key:
        # Remove any trailing characters
        if service_key.endswith('%'):
            service_key = service_key[:-1]
            
        headers = {
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(health_url, headers=headers)
            print(f"✅ Service Key Health: {response.status_code}")
        except Exception as e:
            print(f"❌ Service Key Health Failed: {e}")
    
    print("\n" + "=" * 40)
    print("📋 Next Steps:")
    print("1. If keys are missing, update your .env file")
    print("2. If keys are invalid, get fresh keys from Supabase dashboard")
    print("3. Run the setup_database.sql script in your Supabase SQL Editor")
    print("4. Then run the upload script again")

if __name__ == "__main__":
    refresh_and_test_keys() 