import os
import json
from typing import Dict, Any
from openai import OpenAI
from datetime import datetime

class ProductExtractor:
    def __init__(self, openai_api_key: str = None):
        """
        Initialize the extractor with OpenAI API key.
        
        Args:
            openai_api_key (str, optional): OpenAI API key. If None, will try to get from environment
        """
        # Initialize OpenAI
        self.openai_api_key = openai_api_key or os.getenv('OPENAI_API_KEY')
        if not self.openai_api_key:
            raise ValueError("OpenAI API key must be provided either directly or through OPENAI_API_KEY environment variable")
        self.client = OpenAI(api_key=self.openai_api_key)

    def analyze_with_openai(self, text: str) -> Dict[str, Any]:
        """
        Analyze product description text using OpenAI API to structure the data.
        
        Args:
            text (str): Text to analyze
            
        Returns:
            Dict[str, Any]: Structured data extracted from the text
        """
        prompt = f"""
        Extract the following information from the product description:
        - Product name
        - Brand
        - Price
        - Material composition
        - Key features
        - Style details
        
        Text: {text}
        
        Return the information in a structured JSON format with these exact keys:
        {{
            "product_name": "",
            "brand": "",
            "price": "",
            "material_composition": "",
            "key_features": [],
            "style_details": []
        }}
        """
        
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured product information from text. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the response and structure it
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError as e:
            print(f"Failed to parse response: {response.choices[0].message.content}")
            print(f"Error: {str(e)}")
            return {"error": "Failed to parse OpenAI response"}

    def process_and_save(self, input_file: str, output_file: str):
        """
        Process input descriptions and save results to output file.
        
        Args:
            input_file (str): Path to input file with product descriptions
            output_file (str): Path to output JSON file
        """
        results = []
        
        with open(input_file, 'r') as f:
            descriptions = f.readlines()
        
        for description in descriptions:
            if description.strip():  # Only process non-empty lines
                result = self.analyze_with_openai(description.strip())
                results.append(result)
                print(f"Processed: {result.get('product_name', 'Unknown product')}")
        
        # Save results with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"{output_file.rsplit('.', 1)[0]}_{timestamp}.json"
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {output_path}")

def main():
    # Get API key from environment variable
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("Please set the OPENAI_API_KEY environment variable")
        return

    try:
        # Initialize extractor
        extractor = ProductExtractor(openai_api_key=api_key)
        
        # Define input and output paths
        script_dir = os.path.dirname(os.path.abspath(__file__))
        input_file = os.path.join(script_dir, "..", "input", "product_descriptions.txt")
        output_file = os.path.join(script_dir, "..", "parsed_data", "extracted_products.json")
        
        # Process the descriptions
        extractor.process_and_save(input_file, output_file)
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    main() 