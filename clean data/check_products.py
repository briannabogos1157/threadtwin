import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_products():
    """
    Check what products are currently in the database
    """
    print("🔍 Checking Products in Database")
    print("=" * 40)
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    # Remove any trailing characters
    if supabase_key and supabase_key.endswith('%'):
        supabase_key = supabase_key[:-1]
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    # Try to get all products
    products_url = f"{supabase_url}/rest/v1/products"
    
    try:
        response = requests.get(products_url, headers=headers)
        print(f"📊 Products Table Status: {response.status_code}")
        
        if response.status_code == 200:
            products = response.json()
            print(f"🎉 Success! Found {len(products)} products in the database")
            
            if products:
                print("\n📋 Sample Products:")
                for i, product in enumerate(products[:5]):  # Show first 5 products
                    print(f"\n--- Product {i+1} ---")
                    print(f"ID: {product.get('id', 'N/A')}")
                    print(f"Brand: {product.get('brand', 'N/A')}")
                    print(f"Name: {product.get('name', 'N/A')[:50]}...")
                    print(f"Price: {product.get('price', 'N/A')}")
                    print(f"Category: {product.get('category', 'N/A')}")
                    print(f"Source: {product.get('source', 'N/A')}")
                
                if len(products) > 5:
                    print(f"\n... and {len(products) - 5} more products")
            else:
                print("📭 No products found in the database")
                
        else:
            print(f"❌ Error accessing products: {response.text}")
            
    except Exception as e:
        print(f"❌ Failed to check products: {e}")
    
    # Also try with anon key to see if read access works
    print("\n" + "=" * 40)
    print("🔍 Testing with Anon Key (for read access)")
    
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    if anon_key:
        anon_headers = {
            'apikey': anon_key,
            'Authorization': f'Bearer {anon_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(products_url, headers=anon_headers)
            print(f"📊 Anon Key Access: {response.status_code}")
            
            if response.status_code == 200:
                products = response.json()
                print(f"✅ Anon key can read {len(products)} products")
            else:
                print(f"❌ Anon key error: {response.text}")
                
        except Exception as e:
            print(f"❌ Anon key test failed: {e}")

if __name__ == "__main__":
    check_products() 