import requests
import json
import numpy as np

def test_upload_endpoint():
    url = "https://api.threadtwin.com/api/embedding/upload"
    
    # Create a sample embedding (1536 dimensions like OpenAI embeddings)
    sample_embedding = np.random.rand(1536).tolist()
    
    payload = {
        "imageUrl": "https://example.com/test-image.jpg",
        "brand": "Test Brand",
        "price": 99.99,
        "material": "Cotton",
        "embedding": sample_embedding
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("📤 Testing upload endpoint...")
    print(f"📡 URL: {url}")
    print(f"📦 Payload size: {len(sample_embedding)} dimensions")
    print(f"🏷️ Brand: {payload['brand']}")
    print(f"💰 Price: ${payload['price']}")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"⏱️ Response Time: {response.elapsed.total_seconds():.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Upload successful!")
            print("📄 Response:")
            print(json.dumps(data, indent=2))
        else:
            print("❌ Upload failed:")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"Response text: {response.text}")

if __name__ == "__main__":
    test_upload_endpoint() 