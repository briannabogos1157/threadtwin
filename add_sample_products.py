#!/usr/bin/env python3
import requests
import json

# Your backend URL
BACKEND_URL = "https://api.threadtwin.com"

def add_sample_products():
    """Add sample products to your Supabase database"""
    
    sample_products = [
        {
            "title": "Summer Floral Dress",
            "description": "A beautiful floral dress perfect for summer days. Made from lightweight, breathable fabric with a flattering fit.",
            "price": 89.99,
            "currency": "USD",
            "brand": "Summer Collection",
            "imageUrl": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop",
            "productUrl": "https://example-store.com/summer-floral-dress",
            "tags": ["dress", "summer", "floral", "casual"],
            "fabric": "100% Cotton"
        },
        {
            "title": "Classic Denim Jacket",
            "description": "A timeless denim jacket that goes with everything. Perfect for layering in any season.",
            "price": 79.99,
            "currency": "USD",
            "brand": "Denim Co.",
            "imageUrl": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop",
            "productUrl": "https://example-store.com/denim-jacket",
            "tags": ["jacket", "denim", "casual", "versatile"],
            "fabric": "100% Denim"
        },
        {
            "title": "Premium Cotton T-Shirt",
            "description": "Ultra-soft cotton t-shirt with a modern fit. Available in multiple colors.",
            "price": 29.99,
            "currency": "USD",
            "brand": "Basic Essentials",
            "imageUrl": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop",
            "productUrl": "https://example-store.com/cotton-tshirt",
            "tags": ["tshirt", "basic", "cotton", "casual"],
            "fabric": "100% Organic Cotton"
        },
        {
            "title": "Elegant Evening Gown",
            "description": "A stunning evening gown perfect for special occasions. Features elegant details and a flattering silhouette.",
            "price": 299.99,
            "currency": "USD",
            "brand": "Luxury Fashion",
            "imageUrl": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop",
            "productUrl": "https://example-store.com/evening-gown",
            "tags": ["gown", "evening", "formal", "luxury"],
            "fabric": "Silk and Lace"
        }
    ]
    
    added_products = []
    
    for i, product_data in enumerate(sample_products, 1):
        print(f"Adding product {i}/{len(sample_products)}: {product_data['title']}")
        
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

def search_products(query):
    """Search for products to verify they were added"""
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/products/search",
            params={"query": query}
        )
        
        if response.status_code == 200:
            result = response.json()
            products = result.get('products', [])
            print(f"\n🔍 Found {len(products)} products matching '{query}':")
            for product in products:
                print(f"  - {product['title']} (${product['price']}) - {product['brand']}")
            return products
        else:
            print(f"❌ Search failed: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def get_all_products():
    """Get all products from the database"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/products")
        
        if response.status_code == 200:
            products = response.json()
            print(f"\n📦 Total products in database: {len(products)}")
            for product in products:
                print(f"  - {product['title']} (${product['price']}) - {product['brand']}")
            return products
        else:
            print(f"❌ Failed to get products: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

if __name__ == "__main__":
    print("🚀 Adding sample products to your Supabase database...")
    
    # Add sample products
    added_products = add_sample_products()
    
    if added_products:
        print(f"\n✅ Successfully added {len(added_products)} products!")
        
        # Show all products
        print("\n📋 All products in your database:")
        get_all_products()
        
        # Test search
        print("\n🔍 Testing search functionality...")
        search_products("dress")
        
        print(f"\n✨ Your products are now live in Supabase! Search for them on your frontend at:")
        print(f"   https://threadtwin.com")
    else:
        print("\n❌ No products were added. Check the error messages above.") 