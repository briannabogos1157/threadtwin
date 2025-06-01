from supabase_client import supabase
import time
import uuid

timestamp = int(time.time())

# Sample LTK products with realistic data
test_products = [
    {
        "title": "AGOLDE '90s Pinch Waist High Waist Straight Leg Jeans",
        "name": "90s Pinch Waist High Waist Straight Leg Jeans",
        "price": 198.00,
        "image_url": "https://placehold.co/800x1000/png?text=AGOLDE+Jeans",
        "image": "https://placehold.co/800x1000/png?text=AGOLDE+Jeans",
        "affiliate_link": f"https://www.shopltk.com/explore/item/agolde-90s-pinch-waist-high-waist-straight-leg-jeans?id={uuid.uuid4()}",
        "url": f"https://www.shopltk.com/explore/item/agolde-90s-pinch-waist-high-waist-straight-leg-jeans?id={uuid.uuid4()}",
        "brand": "AGOLDE",
        "category": "Denim",
        "description": "The perfect vintage-inspired high-rise straight leg jeans",
        "fabric": "100% Cotton",
        "source": "ltk_api"
    },
    {
        "title": "Lululemon Define Jacket",
        "name": "Define Jacket",
        "price": 118.00,
        "image_url": "https://placehold.co/800x1000/png?text=Lululemon+Jacket",
        "image": "https://placehold.co/800x1000/png?text=Lululemon+Jacket",
        "affiliate_link": f"https://www.shopltk.com/explore/item/lululemon-define-jacket?id={uuid.uuid4()}",
        "url": f"https://www.shopltk.com/explore/item/lululemon-define-jacket?id={uuid.uuid4()}",
        "brand": "Lululemon",
        "category": "Activewear",
        "description": "Slim-fit running jacket with thumbholes",
        "fabric": "Luon fabric",
        "source": "ltk_api"
    },
    {
        "title": "Olaplex No. 3 Hair Perfector",
        "name": "No. 3 Hair Perfector",
        "price": 30.00,
        "image_url": "https://placehold.co/800x1000/png?text=Olaplex+No.3",
        "image": "https://placehold.co/800x1000/png?text=Olaplex+No.3",
        "affiliate_link": f"https://www.shopltk.com/explore/item/olaplex-no-3-hair-perfector?id={uuid.uuid4()}",
        "url": f"https://www.shopltk.com/explore/item/olaplex-no-3-hair-perfector?id={uuid.uuid4()}",
        "brand": "Olaplex",
        "category": "Beauty",
        "description": "Weekly at-home treatment that reduces breakage and strengthens hair",
        "fabric": "N/A",
        "source": "ltk_api"
    }
]

def add_test_products():
    try:
        print("🔄 Adding test products to database...")
        
        # First, delete existing products to avoid conflicts
        supabase.table("products").delete().neq("id", 0).execute()
        print("✅ Cleared existing products")
        
        for product in test_products:
            response = supabase.table("products").insert(product).execute()
            print(f"✅ Added product: {product['title']}")
        
        print("\n✨ All test products added successfully!")
        
    except Exception as e:
        print(f"❌ Error adding products: {str(e)}")

if __name__ == "__main__":
    add_test_products() 