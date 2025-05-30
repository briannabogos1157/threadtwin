import React, { useState } from 'react';
import axios from 'axios';
import '../config/axios';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  merchant: string;
  imageUrl: string;
  affiliateUrl: string;
}

const ProductSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/skimlinks/search?query=${encodeURIComponent(query)}`);
      setProducts(response.data.products || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
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
          <p className="mt-4 text-gray-600">Searching products...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && products.map((product) => (
          <div key={product.id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg'; // You'll need to add a placeholder image
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-blue-600">
                {product.title}
              </h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {product.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">
                  {product.currency} {product.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  {product.merchant}
                </span>
              </div>
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                View Product
              </a>
            </div>
          </div>
        ))}
      </div>

      {!loading && products.length === 0 && !error && (
        <div className="text-center text-gray-500 mt-8">
          No products found. Try searching for something else!
        </div>
      )}
    </div>
  );
};

export default ProductSearch; 