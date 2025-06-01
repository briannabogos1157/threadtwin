import os
from dotenv import load_dotenv
from supabase_client import supabase

# Load environment variables from .env file
load_dotenv()

try:
    # Example product
    product = {
        "title": "Zara Linen Midi Dress",
        "price": "69.90",
        "image_url": "https://example.com/zara-linen.jpg",
        "affiliate_link": "https://liketk.it/4abcd"
    }

    # Insert into Supabase
    result = supabase.table("products").insert(product).execute()

    if result.data:
        print("✅ Product added successfully!")
        print(f"Product ID: {result.data[0].get('id')}")
    else:
        print("❌ Error: Failed to add product")

except Exception as e:
    print(f"❌ Error: {str(e)}")