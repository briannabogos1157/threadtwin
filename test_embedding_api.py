import requests
import openai

openai.api_key = "YOUR_OPENAI_API_KEY_HERE"  # ← Replace with your actual OpenAI key

def get_embedding(text):
    return openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    ).data[0].embedding

# Get embedding for the product description
embedding = get_embedding("Skims Fits Everybody T-Shirt Bra, polyamide elastane")

# Test the upload API with correct field names
res = requests.post("https://threadtwin.com/api/embedding/upload", json={
    "imageUrl": "https://example.com/skims-bra.jpg",
    "brand": "Skims",
    "price": 54.00,
    "material": "76% polyamide / 24% elastane",
    "embedding": embedding
})

print(f"Status Code: {res.status_code}")
print(f"Response: {res.json()}")

# Test the find-similar API
if res.status_code == 200:
    print("\n--- Testing Find Similar API ---")
    
    # Use the same embedding to find similar products
    similar_res = requests.post("https://threadtwin.com/api/embedding/find-similar", json={
        "embedding": embedding
    })
    
    print(f"Find Similar Status Code: {similar_res.status_code}")
    print(f"Find Similar Response: {similar_res.json()}") 