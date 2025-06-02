from serpapi import GoogleSearch
from dotenv import load_dotenv
import openai
import os
import json
from typing import List, Dict, Any

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
serpapi_key = os.getenv("SERPAPI_KEY")

class ProductSearchService:
    def __init__(self):
        self.serpapi_key = serpapi_key
        self.openai_key = openai.api_key
        if not self.serpapi_key:
            raise ValueError("SERPAPI_KEY not found in environment variables")
        if not self.openai_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")

    def search_dupes_via_serpapi(self, luxury_item: str, num_results: int = 5) -> List[Dict[str, str]]:
        """
        Search for dupes using SerpApi's Google Search
        
        Args:
            luxury_item (str): The luxury item to find dupes for
            num_results (int): Number of results to return
            
        Returns:
            List[Dict]: List of search results
        """
        query = f"affordable alternative to {luxury_item} site:hm.com OR site:forever21.com OR site:zara.com OR site:asos.com"
        params = {
            "q": query,
            "api_key": self.serpapi_key,
            "num": num_results
        }

        try:
            search = GoogleSearch(params)
            results = search.get_dict()
            organic = results.get("organic_results", [])

            return [
                {
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", "")
                } for item in organic
            ]
        except Exception as e:
            print(f"Error searching via SerpApi: {str(e)}")
            return []

    def extract_structured_dupes(self, results: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Use OpenAI to extract structured dupe information from search results
        
        Args:
            results (List[Dict]): Raw search results from SerpApi
            
        Returns:
            List[Dict]: Structured dupe information
        """
        prompt = f"""
You're an AI stylist. A user is searching for affordable dupes of a luxury item.

Here are some search results:
{json.dumps(results)}

Please extract up to 3 realistic alternatives with the following structure:
- title
- retailer
- price (if available)
- description (fit, fabric, construction)
- link

Respond in JSON list format.
"""
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",  # You can change to "gpt-4" if available
                messages=[
                    {"role": "system", "content": "You are a helpful stylist AI."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                print("⚠️ JSON parsing failed. Raw output:")
                print(content)
                return []
        except Exception as e:
            print(f"Error extracting structured dupes: {str(e)}")
            return []

    def get_realistic_dupes(self, luxury_item: str) -> List[Dict[str, str]]:
        """
        Main function to get realistic dupes by combining SerpApi search and OpenAI analysis
        
        Args:
            luxury_item (str): The luxury item to find dupes for
            
        Returns:
            List[Dict]: List of structured dupe suggestions
        """
        search_results = self.search_dupes_via_serpapi(luxury_item)
        if not search_results:
            return []
            
        structured_dupes = self.extract_structured_dupes(search_results)
        return structured_dupes

# Example usage
if __name__ == "__main__":
    search_service = ProductSearchService()
    
    # Example: Search for Skims dress dupes
    luxury_item = "Skims Soft Lounge Long Slip Dress"
    dupes = search_service.get_realistic_dupes(luxury_item)
    
    # Print results
    for i, dupe in enumerate(dupes, start=1):
        print(f"\nDupe #{i}:")
        print(json.dumps(dupe, indent=2)) 