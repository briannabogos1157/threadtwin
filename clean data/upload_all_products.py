import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json
import numpy as np

# Load environment variables
load_dotenv()

def clean_data_for_supabase(df):
    """
    Clean and prepare data for Supabase upload
    """
    # Create a copy of the dataframe
    df_clean = df.copy()
    
    # Remove the 'id' column since Supabase will auto-generate it
    if 'id' in df_clean.columns:
        df_clean = df_clean.drop('id', axis=1)
    
    # Clean up text fields - remove newlines and extra spaces
    text_columns = ['name', 'title', 'description']
    for col in text_columns:
        if col in df_clean.columns:
            df_clean[col] = df_clean[col].astype(str).str.replace('\n', ' ').str.replace('\r', ' ').str.strip()
    
    # Convert empty strings to None for better database handling
    df_clean = df_clean.replace('', None)
    # Convert NaN to None for JSON compliance
    df_clean = df_clean.replace({np.nan: None})
    
    return df_clean

def upload_to_supabase(csv_file, table_name="products"):
    """
    Upload cleaned CSV data to Supabase
    """
    try:
        # Supabase configuration
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")  # Use service role key for uploads
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase credentials!")
            print("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
            return False
        
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Read the CSV file
        print(f"📖 Reading CSV file: {csv_file}")
        df = pd.read_csv(csv_file)
        
        # Clean the data for upload
        print("🧹 Cleaning data for upload...")
        df_clean = clean_data_for_supabase(df)
        
        # Convert DataFrame to list of dictionaries
        records = df_clean.to_dict('records')
        
        print(f"📊 Found {len(records)} products to upload from {csv_file}")
        
        # Upload data to Supabase
        print(f"🚀 Uploading to Supabase table: {table_name}")
        
        # Insert data in batches to avoid timeout
        batch_size = 10  # Increased batch size for efficiency
        successful_uploads = 0
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                result = supabase.table(table_name).insert(batch).execute()
                successful_uploads += len(batch)
                print(f"✅ Uploaded batch {i//batch_size + 1}/{(len(records) + batch_size - 1)//batch_size} ({len(batch)} products)")
            except Exception as batch_error:
                print(f"❌ Error uploading batch {i//batch_size + 1}: {batch_error}")
                # Try uploading one by one
                for j, record in enumerate(batch):
                    try:
                        result = supabase.table(table_name).insert(record).execute()
                        successful_uploads += 1
                        print(f"  ✅ Uploaded product {i + j + 1}")
                    except Exception as single_error:
                        print(f"  ❌ Failed to upload product {i + j + 1}: {single_error}")
        
        print(f"🎉 Successfully uploaded {successful_uploads}/{len(records)} products from {csv_file}!")
        return successful_uploads
        
    except Exception as e:
        print(f"❌ Error uploading {csv_file} to Supabase: {e}")
        return 0

def test_connection():
    """
    Test the Supabase connection
    """
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")  # Use service role key for testing
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase credentials!")
            return False
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Try a simple query to test connection
        result = supabase.table('products').select('*').limit(1).execute()
        print("✅ Supabase connection successful!")
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Upload All Products to Supabase")
    print("=" * 50)
    
    # Skip connection test since we know REST API works
    print("🔍 Skipping connection test and proceeding with upload...")
    
    # List of CSV files to upload
    csv_files = ["cleaned_products.csv", "cleaned_revolve_products.csv"]
    total_uploaded = 0
    
    for csv_file in csv_files:
        if os.path.exists(csv_file):
            print(f"\n📁 Processing {csv_file}...")
            uploaded_count = upload_to_supabase(csv_file)
            total_uploaded += uploaded_count
        else:
            print(f"❌ {csv_file} not found! Skipping...")
    
    print(f"\n🎉 Upload Summary:")
    print(f"Total products uploaded: {total_uploaded}")
    
    if total_uploaded > 0:
        print("\n✅ Upload completed successfully!")
        print("\n📝 Next steps:")
        print("1. Check your Supabase dashboard to verify the data")
        print("2. Go to Table Editor > products to see your data")
        print("3. Set up Row Level Security (RLS) if needed")
    else:
        print("\n❌ No products were uploaded. Please check:")
        print("1. Your Supabase credentials in .env file")
        print("2. That the 'products' table exists in your database")
        print("3. Your Row Level Security (RLS) settings") 