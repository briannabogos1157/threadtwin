import axios from 'axios';
import { ProductDetails } from '@/types/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const ThreadTwinAPI = {
  analyzeProduct: async (url: string): Promise<ProductDetails> => {
    const response = await axios.post(`${API_URL}/api/analyze`, { url });
    return response.data;
  },

  compareProducts: async (originalUrl: string, dupeUrl: string) => {
    const response = await axios.post(`${API_URL}/api/compare`, {
      originalUrl,
      dupeUrl,
    });
    return response.data;
  },

  getResults: async (id: string) => {
    const response = await axios.get(`${API_URL}/api/results/${id}`);
    return response.data;
  },
}; 