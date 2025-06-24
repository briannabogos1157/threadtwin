import requests
import json

def test_search_endpoint():
    url = "https://api.threadtwin.com/api/products/search"
    
    params = {
        "query": "dress"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("🔍 Testing search endpoint...")
    print(f"📡 URL: {url}")
    print(f"🔎 Query: {params['query']}")
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"⏱️ Response Time: {response.elapsed.total_seconds():.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Search successful!")
            print("📄 Response:")
            print(json.dumps(data, indent=2))
            
            if 'products' in data:
                print(f"📦 Found {len(data['products'])} products")
            else:
                print("⚠️ No 'products' key in response")
        else:
            print("❌ Search failed:")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"Response text: {response.text}")

if __name__ == "__main__":
    test_search_endpoint() 