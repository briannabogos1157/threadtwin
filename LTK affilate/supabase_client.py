from supabase import create_client
from dotenv import load_dotenv
import os

# 🔐 Load .env file
load_dotenv()

# 🌐 Get environment variables
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# ⚙️ Connect to Supabase
supabase = create_client(url, key)

# 🛍️ Example product
product = {
    "title": "Zara Linen Midi Dress",
    "price": "69.90",
    "image_url": "https://example.com/zara-linen.jpg",
    "affiliate_link": "https://liketk.it/4abcd"
}

# ➕ Insert into Supabase
try:
    response = supabase.table("products").insert(product).execute()
    print("✅ Product added successfully!")
except Exception as e:
    print(f"❌ Error adding product: {str(e)}")

# Export the client instance
__all__ = ['supabase'] 