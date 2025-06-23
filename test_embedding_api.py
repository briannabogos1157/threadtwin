import requests
import openai
import os

# Set your OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_embedding(text):
    return openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    ).data[0].embedding

# Get embedding for the product description
embedding = get_embedding("Skims Fits Everybody T-Shirt Bra, polyamide elastane")

print("✅ Got embedding successfully!")
print(f"Embedding length: {len(embedding)}")

# Test the upload API with correct field names
print("\n--- Testing Upload API ---")
res = requests.post("https://threadtwin.com/api/embedding/upload", json={
    "imageUrl": "https://example.com/skims-bra.jpg",
    "brand": "Skims",
    "price": 54.00,
    "material": "76% polyamide / 24% elastane",
    "embedding": embedding
})

print(f"Status Code: {res.status_code}")
print(f"Response Headers: {dict(res.headers)}")
print(f"Response Text: {res.text}")

try:
    print(f"Response JSON: {res.json()}")
except Exception as e:
    print(f"Could not parse JSON: {e}")

# Test the find-similar API
if res.status_code == 200:
    print("\n--- Testing Find Similar API ---")
    
    # Use the same embedding to find similar products
    similar_res = requests.post("https://threadtwin.com/api/embedding/find-similar", json={
        "embedding": embedding
    })
    
    print(f"Find Similar Status Code: {similar_res.status_code}")
    print(f"Find Similar Response Text: {similar_res.text}")
    
    try:
        print(f"Find Similar Response JSON: {similar_res.json()}")
    except Exception as e:
        print(f"Could not parse JSON: {e}")
else:
    print(f"\n❌ Upload failed with status {res.status_code}, skipping find-similar test") 