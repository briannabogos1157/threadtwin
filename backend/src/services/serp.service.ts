import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export class ProductSearchService {
  private serpApiKey: string;

  constructor() {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      throw new Error('SERPAPI_KEY not found in environment variables');
    }
    this.serpApiKey = apiKey;
  }

  async search_dupes_via_serpapi(luxuryItem: string, numResults: number = 5): Promise<SearchResult[]> {
    try {
      const query = `affordable alternative to ${luxuryItem} site:hm.com OR site:forever21.com OR site:zara.com OR site:asos.com`;
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${this.serpApiKey}&num=${numResults}`;

      const response = await axios.get(url);
      const results = response.data;
      const organic = results.organic_results || [];

      return organic.map((item: any) => ({
        title: item.title || '',
        link: item.link || '',
        snippet: item.snippet || ''
      }));
    } catch (error) {
      console.error('Error searching via SerpApi:', error);
      return [];
    }
  }
} 