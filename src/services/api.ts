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

const handleApiError = async (response: Response) => {
  const error = await response.json().catch(() => ({ error: 'Unknown error' }));
  
  switch (response.status) {
    case 429:
      throw new Error(`Rate limit exceeded. ${error.retryAfter ? `Please try again in ${Math.ceil(error.retryAfter)} seconds.` : 'Please try again later.'}`);
    case 404:
      throw new Error(error.error || 'Resource not found');
    case 400:
      throw new Error(error.error || 'Invalid request');
    case 503:
      throw new Error(error.error || 'Service temporarily unavailable');
    case 504:
      throw new Error(error.error || 'Request timeout');
    default:
      throw new Error(error.error || 'An unexpected error occurred');
  }
};

export const analyzeProduct = async (url: string) => {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    await handleApiError(response);
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
    await handleApiError(response);
  }

  return response.json();
};

export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  
  if (!response.ok) {
    await handleApiError(response);
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
      await handleApiError(response);
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
      await handleApiError(response);
    }

    return response.json();
  }
}; 