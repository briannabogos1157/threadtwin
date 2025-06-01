import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import '../config/axios';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  image: string;
  url: string;
  fabric: string[];
  fit: string[];
  care: string[];
  construction: string[];
}

const ProductSearch: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log the current axios base URL when component mounts
  useEffect(() => {
    console.log('Current API URL:', axios.defaults.baseURL);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let response;
      if (isUrl(query)) {
        // If it's a URL, use the affiliate endpoint
        response = await axios.post('/api/products/affiliate', { url: query });
        setProducts([response.data]); // Wrap single product in array
      } else {
        // If it's a search term, use the search endpoint
        response = await axios.get('/api/products/affiliate');
        setProducts(response.data || []);
      }
      
      if ((!response.data || (Array.isArray(response.data) && response.data.length === 0))) {
        setError('No products found. Try a different search term or URL.');
      }
    } catch (err: any) {
      console.error('Full error details:', err);
      const errorMessage = err.response?.data?.error || 
        err.response?.data?.message || 
        err.message || 
        'Failed to process request. Please try again.';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleProductSelect = async (product: Product) => {
    try {
      // First analyze the product to get full details
      const response = await axios.post('/api/analyze', { url: product.url });
      const analyzedProduct = response.data;

      // Store the selected product in localStorage with analyzed details
      localStorage.setItem('originalProduct', JSON.stringify({
        name: analyzedProduct.name || product.name,
        price: analyzedProduct.price || product.price,
        description: analyzedProduct.description || product.description || '',
        imageUrl: analyzedProduct.image || product.image,
        url: product.url,
        fabric: analyzedProduct.fabric?.join(', ') || product.fabric?.join(', ') || ''
      }));
      
      // Navigate to the product page
      router.push('/product');
    } catch (error) {
      console.error('Error analyzing product:', error);
      setError('Failed to analyze product details. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isUrl(query) ? "Enter a product URL..." : "Search for products..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isUrl(query) ? 'Add Product' : 'Search'}
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              You can either paste a product URL or search existing products
            </div>
          </div>
        </div>
      </form>

      {error && (
        <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isUrl(query) ? 'Adding product...' : 'Searching products...'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && products.map((product) => (
          <div 
            key={product.id} 
            className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer"
            onClick={() => handleProductSelect(product)}
          >
            {product.image ? (
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
            ) : (
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-blue-600">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {product.description || 'No description available'}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">
                  ${product.price}
                </span>
                {product.fabric && product.fabric.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {product.fabric.join(', ')}
                  </span>
                )}
              </div>
              <button
                className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Compare Products
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && products.length === 0 && !error && (
        <div className="text-center text-gray-500 mt-8">
          Enter a product URL or search terms to get started!
        </div>
      )}
    </div>
  );
};

export default ProductSearch; 