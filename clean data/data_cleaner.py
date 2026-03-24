import pandas as pd
import re
from urllib.parse import urlparse
import numpy as np
from datetime import datetime

def clean_data(input_file, output_file):
    """
    Clean and transform the messy CSV data into the desired format
    """
    # Read the CSV file
    df = pd.read_csv(input_file)
    
    # Initialize the cleaned dataframe with the desired columns
    cleaned_data = []
    
    # Process each row
    for index, row in df.iterrows():
        # Skip empty rows or header rows
        if pd.isna(row.iloc[0]) or 'select-none' in str(row.iloc[0]):
            continue
            
        # Extract URL (first column)
        url = str(row.iloc[0]).strip()
        if not url.startswith('http'):
            continue
            
        # Determine brand based on URL
        brand = extract_brand_from_url(url)
        
        # Extract product information
        product_info = extract_product_info(row, brand)
        
        if product_info:
            cleaned_data.append(product_info)
    
    # Create the cleaned dataframe
    cleaned_df = pd.DataFrame(cleaned_data)
    
    # Add missing columns with default values
    required_columns = [
        'id', 'brand', 'name', 'fabric', 'price', 'url', 'image', 
        'category', 'source', 'description', 'created_at', 'updated_at', 
        'title', 'image_url', 'color'
    ]
    
    for col in required_columns:
        if col not in cleaned_df.columns:
            cleaned_df[col] = ''
    
    # Reorder columns
    cleaned_df = cleaned_df[required_columns]
    
    # Add sequential IDs
    cleaned_df['id'] = range(1, len(cleaned_df) + 1)
    
    # Add timestamps
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cleaned_df['created_at'] = current_time
    cleaned_df['updated_at'] = current_time
    
    # Save the cleaned data
    cleaned_df.to_csv(output_file, index=False)
    
    print(f"Data cleaned successfully! Saved to {output_file}")
    print(f"Total products processed: {len(cleaned_df)}")
    
    return cleaned_df

def extract_brand_from_url(url):
    """Extract brand name from URL"""
    if 'skims.com' in url:
        return 'Skims'
    elif 'lululemon.com' in url:
        return 'Lululemon'
    elif 'revolve.com' in url:
        return 'Revolve'
    else:
        return 'Unknown'

def extract_product_info(row, brand):
    """Extract product information from a row based on brand"""
    try:
        url = str(row.iloc[0]).strip()
        
        if brand == 'Skims':
            return extract_skims_info(row, url)
        elif brand == 'Lululemon':
            return extract_lululemon_info(row, url)
        elif brand == 'Revolve':
            return extract_revolve_info(row, url)
        else:
            return None
    except Exception as e:
        print(f"Error processing row: {e}")
        return None

def extract_skims_info(row, url):
    """Extract Skims product information"""
    try:
        # Extract name from URL
        name = extract_name_from_skims_url(url)
        
        # Extract price (usually in column 15)
        price = extract_price_from_row(row, 15)
        
        # Extract image URL (usually in column 1)
        image_url = str(row.iloc[1]) if len(row) > 1 and pd.notna(row.iloc[1]) else ''
        
        # Extract fabric info (if available)
        fabric = extract_fabric_info(row)
        
        # Extract color from URL
        color = extract_color_from_skims_url(url)
        
        return {
            'brand': 'Skims',
            'name': name,
            'fabric': fabric,
            'price': price,
            'url': url,
            'image': image_url,
            'category': '',
            'source': 'Skims',
            'description': '',
            'title': name,
            'image_url': image_url,
            'color': color
        }
    except Exception as e:
        print(f"Error extracting Skims info: {e}")
        return None

def extract_lululemon_info(row, url):
    """Extract Lululemon product information"""
    try:
        # Extract name from row (usually in column 15)
        name = str(row.iloc[15]) if len(row) > 15 and pd.notna(row.iloc[15]) else ''
        
        # Extract price (usually in column 16)
        price = extract_price_from_row(row, 16)
        
        # Extract image URL (usually in column 1)
        image_url = str(row.iloc[1]) if len(row) > 1 and pd.notna(row.iloc[1]) else ''
        
        # Extract color from URL
        color = extract_color_from_lululemon_url(url)
        
        return {
            'brand': 'Lululemon',
            'name': name,
            'fabric': '',
            'price': price,
            'url': url,
            'image': image_url,
            'category': '',
            'source': 'Lululemon',
            'description': '',
            'title': name,
            'image_url': image_url,
            'color': color
        }
    except Exception as e:
        print(f"Error extracting Lululemon info: {e}")
        return None

def extract_revolve_info(row, url):
    """Extract Revolve product information"""
    try:
        # Extract name from row (usually in column 4)
        name = str(row.iloc[4]) if len(row) > 4 and pd.notna(row.iloc[4]) else ''
        
        # Extract brand from row (usually in column 5)
        brand = str(row.iloc[5]) if len(row) > 5 and pd.notna(row.iloc[5]) else ''
        
        # Extract price (usually in column 6)
        price = extract_price_from_row(row, 6)
        
        # Extract image URL (usually in column 3)
        image_url = str(row.iloc[3]) if len(row) > 3 and pd.notna(row.iloc[3]) else ''
        
        return {
            'brand': brand,
            'name': name,
            'fabric': '',
            'price': price,
            'url': url,
            'image': image_url,
            'category': '',
            'source': 'Revolve',
            'description': '',
            'title': name,
            'image_url': image_url,
            'color': ''
        }
    except Exception as e:
        print(f"Error extracting Revolve info: {e}")
        return None

def extract_name_from_skims_url(url):
    """Extract product name from Skims URL"""
    try:
        # Extract the product name from the URL
        # Example: https://skims.com/products/fits-everybody-t-shirt-bra-onyx
        parts = url.split('/products/')
        if len(parts) > 1:
            product_part = parts[1].split('?')[0]  # Remove query parameters
            # Convert hyphens to spaces and capitalize
            name = product_part.replace('-', ' ').title()
            # Remove color suffix
            name = re.sub(r'\s+(onyx|clay|ruby|snow-strawberry-print|etc)$', '', name, flags=re.IGNORECASE)
            return name
        return ''
    except:
        return ''

def extract_price_from_row(row, price_column_index):
    """Extract price from a specific column"""
    try:
        if len(row) > price_column_index and pd.notna(row.iloc[price_column_index]):
            price_str = str(row.iloc[price_column_index]).strip()
            # Extract dollar amount
            price_match = re.search(r'\$(\d+)', price_str)
            if price_match:
                return f"${price_match.group(1)}"
        return ''
    except:
        return ''

def extract_fabric_info(row):
    """Extract fabric information if available"""
    # Look for fabric information in the row
    for i, cell in enumerate(row):
        if pd.notna(cell) and isinstance(cell, str):
            if '%' in cell and any(fabric in cell.lower() for fabric in ['polyamide', 'elastane', 'cotton', 'polyester']):
                return cell.strip()
    return ''

def extract_color_from_skims_url(url):
    """Extract color from Skims URL"""
    try:
        # Extract color from the end of the URL
        color_match = re.search(r'-([^-]+)$', url.split('/products/')[1].split('?')[0])
        if color_match:
            color = color_match.group(1).replace('-', ' ').title()
            return color
        return ''
    except:
        return ''

def extract_color_from_lululemon_url(url):
    """Extract color from Lululemon URL"""
    try:
        # Extract color from URL parameters
        color_match = re.search(r'color=(\d+)', url)
        if color_match:
            return color_match.group(1)
        return ''
    except:
        return ''

if __name__ == "__main__":
    # Clean the data
    input_file = "/Users/briannabogos/clean data/Dupes I like - Sheet2.csv"
    output_file = "cleaned_products.csv"
    
    cleaned_df = clean_data(input_file, output_file)
    
    # Display first few rows
    print("\nFirst 10 cleaned products:")
    print(cleaned_df.head(10).to_string(index=False)) 