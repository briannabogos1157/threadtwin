import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def create_table_in_supabase():
    """
    Create the products table in Supabase
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
        
        # SQL to create the table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            brand VARCHAR(255),
            name TEXT,
            fabric TEXT,
            price VARCHAR(50),
            url TEXT,
            image TEXT,
            category VARCHAR(255),
            source VARCHAR(255),
            description TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP,
            title TEXT,
            image_url TEXT,
            color VARCHAR(255)
        );
        """
        
        print("🔨 Creating products table in Supabase...")
        result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
        print("✅ Table created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        print("Note: You may need to create the table manually in the Supabase dashboard")
        return False

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
    
    return df_clean

def upload_to_supabase(csv_file, table_name="products"):
    """
    Upload cleaned CSV data to Supabase
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
        print(f"📖 Reading CSV file: {csv_file}")
        df = pd.read_csv(csv_file)
        
        # Clean the data for upload
        print("🧹 Cleaning data for upload...")
        df_clean = clean_data_for_supabase(df)
        
        # Convert DataFrame to list of dictionaries
        records = df_clean.to_dict('records')
        
        print(f"📊 Found {len(records)} products to upload")
        
        # Upload data to Supabase
        print(f"🚀 Uploading to Supabase table: {table_name}")
        
        # Try uploading all at once first
        try:
            result = supabase.table(table_name).insert(records).execute()
            print(f"🎉 Successfully uploaded all {len(records)} products to Supabase!")
            return True
        except Exception as bulk_error:
            print(f"Bulk upload failed, trying individual uploads: {bulk_error}")
            
            # If bulk upload fails, try individual uploads
            successful_uploads = 0
            for i, record in enumerate(records):
                try:
                    result = supabase.table(table_name).insert(record).execute()
                    successful_uploads += 1
                    print(f"✅ Uploaded product {i + 1}/{len(records)}")
                except Exception as single_error:
                    print(f"❌ Failed to upload product {i + 1}: {single_error}")
            
            print(f"🎉 Successfully uploaded {successful_uploads}/{len(records)} products to Supabase!")
            return successful_uploads > 0
        
    except Exception as e:
        print(f"❌ Error uploading to Supabase: {e}")
        return False

def test_connection():
    """
    Test the Supabase connection
    """
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
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
    csv_file = "cleaned_products.csv"
    
    if not os.path.exists(csv_file):
        print(f"❌ Error: {csv_file} not found!")
        print("Please run the data_cleaner.py script first to generate the cleaned CSV file.")
    else:
        print("🔧 Supabase Setup and Upload Script")
        print("=" * 50)
        
        # Test connection first
        print("🔍 Testing Supabase connection...")
        if not test_connection():
            print("❌ Cannot connect to Supabase. Please check your credentials.")
            exit(1)
        
        # Try to create table (this might fail if you don't have permissions)
        create_table_in_supabase()
        
        # Upload data
        success = upload_to_supabase(csv_file)
        
        if success:
            print("\n✅ Upload completed successfully!")
            print("\n📝 Next steps:")
            print("1. Check your Supabase dashboard to verify the data")
            print("2. Go to Table Editor > products to see your data")
            print("3. Set up Row Level Security (RLS) if needed")
        else:
            print("\n❌ Upload failed. Please check:")
            print("1. Your Supabase credentials in .env file")
            print("2. That the 'products' table exists in your database")
            print("3. Your Row Level Security (RLS) settings") 