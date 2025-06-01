from supabase_client import supabase

print("🗑️ Deleting all existing products...")

try:
    # Delete all products
    result = supabase.table("products").delete().neq("id", 0).execute()
    print("✅ All products deleted successfully!")
except Exception as e:
    print(f"❌ Error deleting products: {e}") 