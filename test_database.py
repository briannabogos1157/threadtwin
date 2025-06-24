import requests
import json

def test_database_content():
    url = "https://api.threadtwin.com/api/embedding/find-similar"
    
    # Send a minimal request to see the response
    payload = {
        "embedding": [0.1] * 1536  # Simple test embedding
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("🔍 Testing database content...")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Response received:")
            print(json.dumps(data, indent=2))
        else:
            print("❌ Error response:")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_database_content() 