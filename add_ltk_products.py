#!/usr/bin/env python3
import requests
import json
import uuid
import time

# Your backend URL
BACKEND_URL = "https://api.threadtwin.com"

def add_ltk_products():
    """Add LTK affiliate products to your Supabase database"""
    
    ltk_products = [
        {
            "title": "AGOLDE '90s Pinch Waist High Waist Straight Leg Jeans",
            "description": "The perfect vintage-inspired high-rise straight leg jeans with a flattering fit and timeless style.",
            "price": 198.00,
            "currency": "USD",
            "brand": "AGOLDE",
            "imageUrl": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop",
            "productUrl": f"https://www.shopltk.com/explore/item/agolde-90s-pinch-waist-high-waist-straight-leg-jeans?id={uuid.uuid4()}",
            "tags": ["jeans", "denim", "high-waist", "straight-leg"],
            "fabric": "100% Cotton"
        },
        {
            "title": "Lululemon Define Jacket",
            "description": "Slim-fit running jacket with thumbholes and moisture-wicking fabric. Perfect for workouts and athleisure.",
            "price": 118.00,
            "currency": "USD",
            "brand": "Lululemon",
            "imageUrl": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop",
            "productUrl": f"https://www.shopltk.com/explore/item/lululemon-define-jacket?id={uuid.uuid4()}",
            "tags": ["jacket", "athleisure", "workout", "slim-fit"],
            "fabric": "Luon fabric"
        },
        {
            "title": "Olaplex No. 3 Hair Perfector",
            "description": "Weekly at-home treatment that reduces breakage and strengthens hair. Professional-grade hair repair.",
            "price": 30.00,
            "currency": "USD",
            "brand": "Olaplex",
            "imageUrl": "https://images.unsplash.com/photo-1522338140263-f46f5913618a?w=400&h=600&fit=crop",
            "productUrl": f"https://www.shopltk.com/explore/item/olaplex-no-3-hair-perfector?id={uuid.uuid4()}",
            "tags": ["hair", "treatment", "repair", "beauty"],
            "fabric": "Hair care product"
        }
    ]
    
    added_products = []
    
    for i, product_data in enumerate(ltk_products, 1):
        print(f"Adding LTK product {i}/{len(ltk_products)}: {product_data['title']}")
        
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
    print("🚀 Adding LTK affiliate products to your Supabase database...")
    
    # Add LTK products
    added_products = add_ltk_products()
    
    if added_products:
        print(f"\n✅ Successfully added {len(added_products)} LTK products!")
        
        # Show all products
        print("\n📋 All products in your database:")
        get_all_products()
        
        print(f"\n✨ Your LTK affiliate products are now live in Supabase!")
    else:
        print("\n❌ No LTK products were added. Check the error messages above.") 