import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import numpy as np

# Load environment variables
load_dotenv()

def clean_data_for_upload(df):
    """
    Clean data for Supabase upload
    """
    # Remove id column
    if 'id' in df.columns:
        df = df.drop('id', axis=1)
    
    # Clean text fields
    text_columns = ['name', 'title', 'description']
    for col in text_columns:
        if col in df.columns:
            df[col] = df[col].astype(str).str.replace('\n', ' ').str.strip()
    
    # Replace NaN values with None
    df = df.replace({np.nan: None})
    
    # Replace empty strings with None
    df = df.replace('', None)
    
    return df

def upload_products():
    """
    Upload products to Supabase
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
        
        # Read and clean the CSV file
        print("📖 Reading cleaned_products.csv...")
        df = pd.read_csv("cleaned_products.csv")
        
        print("🧹 Cleaning data...")
        df_clean = clean_data_for_upload(df)
        
        # Convert to records
        records = df_clean.to_dict('records')
        
        print(f"📊 Preparing to upload {len(records)} products...")
        
        # Test with first record
        print("🧪 Testing with first record...")
        test_result = supabase.table('products').insert(records[0]).execute()
        print("✅ First record uploaded successfully!")
        
        # Upload remaining records
        print("🚀 Uploading remaining records...")
        remaining_records = records[1:]
        if remaining_records:
            result = supabase.table('products').insert(remaining_records).execute()
            print(f"✅ Uploaded {len(remaining_records)} more records!")
        
        print(f"🎉 Successfully uploaded all {len(records)} products to Supabase!")
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
    print("🚀 Final Supabase Upload")
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