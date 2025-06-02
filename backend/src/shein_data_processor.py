import pandas as pd
import numpy as np
from supabase import create_client
from dotenv import load_dotenv
import os
import json
import ast
from typing import Dict, List
import logging
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials. Please check your .env file.")

supabase = create_client(supabase_url, supabase_key)

def clean_price(price: str) -> float:
    """Clean price string and convert to float."""
    try:
        if isinstance(price, (int, float)):
            return float(price)
        if isinstance(price, str):
            # Remove currency symbols and convert to float
            cleaned = ''.join(filter(lambda x: x.isdigit() or x == '.', price))
            return float(cleaned) if cleaned else 0.0
        return 0.0
    except (ValueError, TypeError):
        return 0.0

def extract_fabric_info(description: List[Dict]) -> List[str]:
    """Extract fabric information from product description."""
    fabrics = []
    
    if isinstance(description, str):
        try:
            description = ast.literal_eval(description)
        except:
            return ['Not specified']
    
    if isinstance(description, list):
        for item in description:
            if isinstance(item, dict):
                if 'Composition' in item:
                    fabrics.extend([f.strip() for f in item['Composition'].lower().split(',')])
                if 'Material' in item:
                    fabrics.append(item['Material'].lower())
                if 'Fabric' in item:
                    fabrics.append(item['Fabric'].lower())
    
    return fabrics if fabrics else ['Not specified']

def extract_care_instructions(description: List[Dict]) -> List[str]:
    """Extract care instructions from product description."""
    if isinstance(description, str):
        try:
            description = ast.literal_eval(description)
        except:
            return ['Machine wash cold']
    
    if isinstance(description, list):
        for item in description:
            if isinstance(item, dict) and 'Care Instructions' in item:
                return [item['Care Instructions']]
    
    return ['Machine wash cold']

def get_first_image(images: str) -> str:
    """Get the first image URL from the images list."""
    try:
        image_list = ast.literal_eval(images)
        return image_list[0] if image_list else ''
    except:
        return ''

def process_shein_data(file_path: str):
    """Process SHEIN data and upload to Supabase."""
    try:
        # Read CSV file with different encodings
        encodings = ['utf-8', 'latin1', 'cp1252']
        df = None
        
        for encoding in encodings:
            try:
                df = pd.read_csv(file_path, encoding=encoding, sep=';')
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise ValueError("Could not read the CSV file with any of the attempted encodings")

        logger.info(f"Successfully read CSV file with {len(df)} rows")
        
        # Process each row
        for index, row in df.iterrows():
            try:
                # Clean and transform data
                product_data = {
                    'brand': 'SHEIN',
                    'name': str(row.get('name', '')),
                    'price': str(clean_price(row.get('price', 0))),  # Convert to string as per schema
                    'description': str(row.get('description', '')),
                    'url': str(row.get('url', '')),
                    'fabricComposition': [str(row.get('fabric_composition', ''))],  # Array as per schema
                    'careInstructions': ['Machine wash cold'],  # Default care instructions
                    'constructionDetails': ['Standard construction'],  # Default construction details
                    'images': [str(row.get('image_url', ''))]  # Convert single image to array
                }

                # Insert data into Supabase
                result = supabase.table('products').insert(product_data).execute()
                logger.info(f"Inserted product {index + 1}: {product_data['name']}")
                
            except Exception as e:
                logger.error(f"Error processing row {index}: {str(e)}")
                continue

        logger.info("Data processing completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python shein_data_processor.py <path_to_csv_file>")
        sys.exit(1)
        
    csv_file_path = sys.argv[1]
    process_shein_data(csv_file_path) 