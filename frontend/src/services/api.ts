import axios from 'axios';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const ThreadTwinAPI = {
  async compareProducts(originalUrl: string, dupeUrl: string): Promise<ComparisonResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/compare`, {
        originalUrl,
        dupeUrl
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to compare products');
      }
      throw error;
    }
  },

  async analyzeProduct(url: string): Promise<ProductDetails> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
        url
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to analyze product');
      }
      throw error;
    }
  },

  getResults: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/results/${id}`);
    return response.data;
  },
}; 