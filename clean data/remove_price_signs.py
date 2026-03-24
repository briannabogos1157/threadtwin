import pandas as pd
import re

def remove_price_signs():
    # Read the cleaned products CSV
    df = pd.read_csv('cleaned_products.csv')
    
    # Remove dollar signs from price column
    df['price'] = df['price'].astype(str).str.replace('$', '', regex=False)
    
    # Save the updated data
    df.to_csv('cleaned_products.csv', index=False)
    
    print("Dollar signs removed from price column!")
    print(f"Updated {len(df)} products")
    
    # Show a few examples
    print("\nSample prices after cleaning:")
    for i, price in enumerate(df['price'].head(5)):
        print(f"  Product {i+1}: {price}")

if __name__ == "__main__":
    remove_price_signs() 