import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Supabase configuration
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing Supabase credentials in .env file")
    print("Please make sure SUPABASE_URL and SUPABASE_KEY are set")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(url, key)

def upload_revolve_data():
    """Upload cleaned Revolve data to Supabase"""
    
    # Read the cleaned data
    csv_file = "cleaned_revolve_products.csv"
    
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found")
        print("Please run the cleaning script first: python3 revolve_data_cleaner.py")
        return
    
    print(f"Reading data from {csv_file}...")
    df = pd.read_csv(csv_file)
    
    print(f"Data shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    
    # Convert DataFrame to list of dictionaries
    records = df.to_dict('records')
    
    # Clean the data - replace NaN values with None
    cleaned_records = []
    for record in records:
        cleaned_record = {}
        for key, value in record.items():
            if pd.isna(value) or value == 'nan' or value == '':
                cleaned_record[key] = None
            else:
                cleaned_record[key] = str(value) if isinstance(value, (int, float)) else value
        cleaned_records.append(cleaned_record)
    
    print(f"Prepared {len(cleaned_records)} records for upload")
    
    # Upload data in batches
    batch_size = 50
    total_uploaded = 0
    
    for i in range(0, len(cleaned_records), batch_size):
        batch = cleaned_records[i:i + batch_size]
        
        try:
            print(f"Uploading batch {i//batch_size + 1} ({len(batch)} records)...")
            
            # Insert the batch
            result = supabase.table('products').insert(batch).execute()
            
            if hasattr(result, 'data'):
                uploaded_count = len(result.data) if result.data else 0
                total_uploaded += uploaded_count
                print(f"Successfully uploaded {uploaded_count} records")
            else:
                print("Upload completed (no data returned)")
                total_uploaded += len(batch)
                
        except Exception as e:
            print(f"Error uploading batch {i//batch_size + 1}: {str(e)}")
            
            # Try uploading records individually to identify problematic ones
            print("Attempting individual uploads for this batch...")
            for j, record in enumerate(batch):
                try:
                    supabase.table('products').insert(record).execute()
                    total_uploaded += 1
                    print(f"  Uploaded record {i + j + 1}")
                except Exception as individual_error:
                    print(f"  Failed to upload record {i + j + 1}: {str(individual_error)}")
                    print(f"  Problematic record: {record}")
    
    print(f"\nUpload completed!")
    print(f"Total records uploaded: {total_uploaded}")
    print(f"Total records in file: {len(cleaned_records)}")

if __name__ == "__main__":
    upload_revolve_data() 