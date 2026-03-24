#!/usr/bin/env python3
import requests
import json

# Your backend URL
BACKEND_URL = "https://api.threadtwin.com"

def add_your_products():
    """Add YOUR custom products to Supabase"""
    
    # 🎯 EDIT THIS SECTION WITH YOUR OWN PRODUCTS
    your_products = [
        {
            "title": "Your Product Name Here",
            "description": "Describe your product here. Be detailed about materials, fit, and features.",
            "price": 99.99,  # Change to your price
            "currency": "USD",
            "brand": "Your Brand Name",
            "imageUrl": "https://your-image-url.com/image.jpg",  # Replace with your image URL
            "productUrl": "https://your-store.com/product",  # Replace with your product page
            "tags": ["your", "tags", "here"],  # Add relevant tags
            "fabric": "Your fabric description (e.g., 100% Cotton, Polyester Blend, etc.)"
        },
        # Add more products by copying the above structure:
        # {
        #     "title": "Another Product",
        #     "description": "Another product description",
        #     "price": 149.99,
        #     "currency": "USD",
        #     "brand": "Your Brand",
        #     "imageUrl": "https://your-image-url.com/another-product.jpg",
        #     "productUrl": "https://your-store.com/another-product",
        #     "tags": ["category", "style", "season"],
        #     "fabric": "Fabric description (e.g., 95% Cotton, 5% Elastane)"
        # }
    ]
    
    added_products = []
    
    for i, product_data in enumerate(your_products, 1):
        print(f"Adding product {i}/{len(your_products)}: {product_data['title']}")
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/api/products/admin/add",
                json=product_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Added: {result['product']['title']} (ID: {result['product']['id']})")
                added_products.append(result['product'])
            else:
                print(f"❌ Failed to add {product_data['title']}: {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"❌ Error adding {product_data['title']}: {e}")
    
    return added_products

def search_your_products():
    """Search for your products to verify they were added"""
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/products/search",
            params={"query": "Your Brand"}  # Search for your brand name
        )
        
        if response.status_code == 200:
            result = response.json()
            products = result.get('products', [])
            print(f"\n🔍 Found {len(products)} products from your brand:")
            for product in products:
                print(f"  - {product['title']} (${product['price']})")
            return products
        else:
            print(f"❌ Search failed: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

if __name__ == "__main__":
    print("🚀 Adding YOUR products to Supabase...")
    print("📝 Make sure to edit the 'your_products' list above with your actual product data!")
    
    # Add your products
    added_products = add_your_products()
    
    if added_products:
        print(f"\n✅ Successfully added {len(added_products)} products!")
        
        # Search for your products
        print("\n🔍 Searching for your products...")
        search_your_products()
        
        print(f"\n✨ Your products are now live in Supabase! Search for them on your frontend at:")
        print(f"   https://threadtwin.com")
    else:
        print("\n❌ No products were added. Make sure to:")
        print("   1. Edit the 'your_products' list with your actual product data")
        print("   2. Use valid image URLs that are publicly accessible")
        print("   3. Check that your backend is running and accessible") 