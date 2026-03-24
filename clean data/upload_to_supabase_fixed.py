import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

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
            print("Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")
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
        
        # Insert data in batches to avoid timeout
        batch_size = 5  # Smaller batch size for better reliability
        successful_uploads = 0
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                # Convert batch to JSON to validate
                json_data = json.dumps(batch, default=str)
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
        
        print(f"🎉 Successfully uploaded {successful_uploads}/{len(records)} products to Supabase!")
        return True
        
    except Exception as e:
        print(f"❌ Error uploading to Supabase: {e}")
        return False

def create_table_schema():
    """
    Create the table schema for Supabase
    """
    schema = """
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
    return schema

if __name__ == "__main__":
    # Upload the cleaned data
    csv_file = "cleaned_products.csv"
    
    if not os.path.exists(csv_file):
        print(f"❌ Error: {csv_file} not found!")
        print("Please run the data_cleaner.py script first to generate the cleaned CSV file.")
    else:
        print("🔧 Supabase Upload Script (Fixed)")
        print("=" * 50)
        
        # Show table schema
        print("\n📋 Table Schema:")
        print(create_table_schema())
        
        # Upload data
        success = upload_to_supabase(csv_file)
        
        if success:
            print("\n✅ Upload completed successfully!")
            print("\n📝 Next steps:")
            print("1. Check your Supabase dashboard to verify the data")
            print("2. Set up Row Level Security (RLS) if needed")
            print("3. Create any necessary indexes for performance")
        else:
            print("\n❌ Upload failed. Please check your Supabase credentials and try again.") 