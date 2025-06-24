import requests
import json
import numpy as np

# Test the find-similar API endpoint
def test_find_similar():
    url = "https://api.threadtwin.com/api/embedding/find-similar"
    
    # Create a sample embedding (1536 dimensions like OpenAI embeddings)
    sample_embedding = np.random.rand(1536).tolist()
    
    payload = {
        "embedding": sample_embedding
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("🧪 Testing find-similar API endpoint...")
    print(f"📡 URL: {url}")
    print(f"📦 Payload size: {len(sample_embedding)} dimensions")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"⏱️ Response Time: {response.elapsed.total_seconds():.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"📈 Found {data.get('count', 0)} similar products")
            
            if data.get('results'):
                print("\n🏆 Top matches:")
                for i, result in enumerate(data['results'][:3], 1):
                    print(f"  {i}. Product ID: {result.get('id')}")
                    print(f"     Similarity: {result.get('similarity', 0):.4f}")
                    print(f"     Distance: {result.get('distance', 0):.4f}")
                    if result.get('productName'):
                        print(f"     Name: {result.get('productName')}")
                    print()
            else:
                print("ℹ️ No results returned")
        else:
            print("❌ Error response:")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"Response text: {response.text}")

if __name__ == "__main__":
    test_find_similar() 