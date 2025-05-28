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

export const analyzeProduct = async (url: string) => {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze product');
  }

  return response.json();
};

export const compareProducts = async (productIds: string[]) => {
  const response = await fetch(`${API_BASE_URL}/api/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to compare products');
  }

  return response.json();
};

export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  
  if (!response.ok) {
    throw new Error('API health check failed');
  }

  return response.json();
};

export const ThreadTwinAPI = {
  async compareProducts(originalUrl: string, dupeUrl: string) {
    const response = await fetch('/api/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ originalUrl, dupeUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to compare products');
    }

    return response.json();
  },

  async analyzeProduct(url: string) {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze product');
    }

    return response.json();
  }
}; 