import pandas as pd
import re

def remove_revolve_price_signs():
    # Read the cleaned Revolve products CSV
    df = pd.read_csv('cleaned_revolve_products.csv')
    
    # Remove dollar signs from price column
    df['price'] = df['price'].astype(str).str.replace('$', '', regex=False)
    
    # Save the updated data
    df.to_csv('cleaned_revolve_products.csv', index=False)
    
    print("Dollar signs removed from Revolve products price column!")
    print(f"Updated {len(df)} Revolve products")
    
    # Show a few examples
    print("\nSample Revolve prices after cleaning:")
    for i, price in enumerate(df['price'].head(5)):
        print(f"  Product {i+1}: {price}")

if __name__ == "__main__":
    remove_revolve_price_signs() 