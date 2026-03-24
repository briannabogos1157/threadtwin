import pandas as pd
import re
from datetime import datetime
import uuid

def clean_revolve_data(input_file, output_file):
    """
    Clean and transform Revolve product data from Sheet4
    """
    print(f"Reading data from {input_file}...")
    
    # Read the CSV file
    df = pd.read_csv(input_file)
    
    print(f"Original data shape: {df.shape}")
    print(f"Original columns: {list(df.columns)}")
    
    # Clean the data
    cleaned_data = []
    
    for index, row in df.iterrows():
        try:
            # Extract product ID from URL
            url = row['js-plp-pdp-link href']
            product_id = extract_product_id(url)
            
            # Clean price - keep as string to match table schema
            price_str = str(row['plp_price']).strip()
            price = clean_price_string(price_str)
            
            # Clean brand name
            brand = clean_text(str(row['product-brand']))
            
            # Clean product name
            name = clean_text(str(row['product-name']))
            
            # Extract image URL
            image_url = str(row['plp-image src'])
            if image_url == 'nan' or 'data:image/gif' in image_url:
                image_url = None
            
            # Determine category based on product name
            category = determine_category(name)
            
            # Create description
            description = f"{brand} {name}"
            
            # Create title
            title = f"{brand} {name}"
            
            # Create cleaned record - match exact table schema (without color)
            cleaned_record = {
                'brand': brand,
                'name': name,
                'fabric': None,  # Not available in this data
                'price': price,
                'url': url,
                'image': image_url,
                'category': category,
                'source': 'Revolve',
                'description': description,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'title': title,
                'image_url': image_url
            }
            
            cleaned_data.append(cleaned_record)
            
        except Exception as e:
            print(f"Error processing row {index}: {e}")
            continue
    
    # Create DataFrame
    cleaned_df = pd.DataFrame(cleaned_data)
    
    # Remove duplicates based on brand + name combination
    cleaned_df = cleaned_df.drop_duplicates(subset=['brand', 'name'])
    
    # Remove rows with missing essential data
    cleaned_df = cleaned_df.dropna(subset=['brand', 'name', 'price'])
    
    # Ensure all columns exist and are in the correct order (without color)
    expected_columns = [
        'brand', 'name', 'fabric', 'price', 'url', 'image', 'category', 
        'source', 'description', 'created_at', 'updated_at', 'title', 
        'image_url'
    ]
    
    # Add missing columns with None values
    for col in expected_columns:
        if col not in cleaned_df.columns:
            cleaned_df[col] = None
    
    # Reorder columns to match table schema
    cleaned_df = cleaned_df[expected_columns]
    
    # Convert price to string if it's numeric
    if 'price' in cleaned_df.columns:
        cleaned_df['price'] = cleaned_df['price'].astype(str)
    
    print(f"Cleaned data shape: {cleaned_df.shape}")
    print(f"Cleaned columns: {list(cleaned_df.columns)}")
    
    # Save to CSV
    cleaned_df.to_csv(output_file, index=False)
    print(f"Cleaned data saved to {output_file}")
    
    # Display sample of cleaned data
    print("\nSample of cleaned data:")
    print(cleaned_df.head())
    
    return cleaned_df

def extract_product_id(url):
    """Extract product ID from Revolve URL"""
    if pd.isna(url) or url == 'nan':
        return str(uuid.uuid4())
    
    # Try to extract from URL pattern like /product-name/dp/PRODUCT-ID/
    match = re.search(r'/dp/([A-Z]+-[A-Z0-9]+)/', url)
    if match:
        return match.group(1)
    
    # Fallback to generating a UUID
    return str(uuid.uuid4())

def clean_price_string(price_str):
    """Clean price and return as string to match table schema"""
    if pd.isna(price_str) or price_str == 'nan':
        return None
    
    # Remove $ and any other non-numeric characters except decimal point
    price_clean = re.sub(r'[^\d.]', '', str(price_str))
    
    try:
        if price_clean:
            # Convert to float first to validate, then back to string
            price_float = float(price_clean)
            return f"${price_float:.2f}"
        return None
    except ValueError:
        return None

def clean_text(text):
    """Clean text by removing extra whitespace and special characters"""
    if pd.isna(text) or text == 'nan':
        return None
    
    # Remove extra whitespace
    cleaned = re.sub(r'\s+', ' ', str(text).strip())
    return cleaned

def determine_category(product_name):
    """Determine product category based on product name"""
    if pd.isna(product_name):
        return 'Clothing'
    
    name_lower = product_name.lower()
    
    # Category keywords
    categories = {
        'Dress': ['dress', 'gown'],
        'Top': ['top', 'shirt', 'blouse', 'cami', 'tank', 'corset', 'vest', 'halter'],
        'Bottom': ['pant', 'jean', 'short', 'skirt', 'trouser', 'capri'],
        'Swimwear': ['bikini', 'swim', 'bathing'],
        'Activewear': ['sport', 'athletic', 'workout', 'gym'],
        'Outerwear': ['jacket', 'coat', 'blazer', 'cardigan', 'sweater'],
        'Lingerie': ['bra', 'underwear', 'lingerie', 'intimate'],
        'Accessories': ['bag', 'purse', 'wallet', 'jewelry', 'scarf', 'hat']
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in name_lower:
                return category
    
    return 'Clothing'  # Default category

if __name__ == "__main__":
    input_file = "Dupes I like - Sheet4.csv"
    output_file = "cleaned_revolve_products.csv"
    
    cleaned_data = clean_revolve_data(input_file, output_file)
    print(f"\nSuccessfully cleaned {len(cleaned_data)} products!") 