import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def upload_products():
    """
    Simple upload script for products
    """
    try:
        # Supabase configuration
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase credentials!")
            return False
        
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Read the CSV file
        print("📖 Reading cleaned_products.csv...")
        df = pd.read_csv("cleaned_products.csv")
        
        # Remove the id column (let Supabase auto-generate)
        if 'id' in df.columns:
            df = df.drop('id', axis=1)
        
        # Clean up text fields
        df['name'] = df['name'].astype(str).str.replace('\n', ' ').str.strip()
        df['title'] = df['title'].astype(str).str.replace('\n', ' ').str.strip()
        
        # Convert empty strings to None
        df = df.replace('', None)
        
        # Convert to records
        records = df.to_dict('records')
        
        print(f"📊 Preparing to upload {len(records)} products...")
        
        # Upload all records at once
        result = supabase.table('products').insert(records).execute()
        
        print(f"🎉 Successfully uploaded {len(records)} products to Supabase!")
        print("✅ Check your Supabase dashboard to see the data!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure you've created the 'products' table in Supabase")
        print("2. Run the SQL in create_table.sql in your Supabase dashboard")
        print("3. Check that Row Level Security is disabled for testing")
        return False

if __name__ == "__main__":
    print("🚀 Simple Supabase Upload")
    print("=" * 30)
    
    if not os.path.exists("cleaned_products.csv"):
        print("❌ cleaned_products.csv not found!")
        print("Please run data_cleaner.py first.")
    else:
        success = upload_products()
        
        if success:
            print("\n🎉 Upload successful!")
            print("📱 Go to your Supabase dashboard > Table Editor > products")
        else:
            print("\n❌ Upload failed. Please check the troubleshooting steps above.") 