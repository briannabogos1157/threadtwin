interface ProductDetails {
  name: string;
  price: number;
  fabricComposition: string[];
  construction: string[];
  fit: string[];
  careInstructions: string[];
  images: string[];
}

interface MatchBreakdown {
  fabric: number;
  fit: number;
  construction: number;
  care: number;
  total: number;
}

interface ComparisonResult {
  original: ProductDetails;
  dupe: ProductDetails;
  matchBreakdown: MatchBreakdown;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export const ThreadTwinAPI = {
  async analyzeProduct(url: string): Promise<ProductDetails> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze product');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing product:', error);
      throw error;
    }
  },

  async compareProducts(originalUrl: string, dupeUrl: string): Promise<ComparisonResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl, dupeUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare products');
      }

      return await response.json();
    } catch (error) {
      console.error('Error comparing products:', error);
      throw error;
    }
  },
}; 