'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../config/axios';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  merchant: string;
  imageUrl: string;
  productUrl: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchParams) return;
    const query = searchParams.get('q');
    if (!query) return;

    const searchProducts = async () => {
      setIsLoading(true);
      setError('');

      try {
        console.log('[Search] Making request for query:', query);
        const response = await api.get(`/api/products/search?query=${encodeURIComponent(query)}`);
        console.log('[Search] Received response:', response.data);
        
        if (response.data.error) {
          setError(response.data.error);
          setProducts([]);
          return;
        }

        if (!response.data.products) {
          console.error('[Search] No products array in response:', response.data);
          setError('Invalid response from server');
          setProducts([]);
          return;
        }

        // Transform the backend data to match our frontend interface
        const transformedProducts = response.data.products.map((product: any) => ({
          ...product,
          currency: '$', // Add default currency
          productUrl: product.imageUrl, // Use imageUrl as productUrl for now
          affiliateUrl: product.imageUrl, // Use imageUrl as affiliateUrl for now
          merchant: product.brand // Use brand as merchant
        }));

        console.log('[Search] Transformed products:', transformedProducts);
        setProducts(transformedProducts);
      } catch (err: any) {
        console.error('[Search] Error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else if (err.message === 'Network Error') {
          setError('Unable to connect to the search service. Please try again later.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchProducts();
  }, [searchParams]);

  const handleFindDupes = (product: Product) => {
    try {
      const productData = {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        merchant: product.merchant,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl
      };
      localStorage.setItem('originalProduct', JSON.stringify(productData));
      router.push('/product');
    } catch (err) {
      console.error('Error storing product data:', err);
      setError('Failed to process product. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-medium mb-8">Search Results</h2>

        {error && (
          <div className="text-red-600 mb-6">{error}</div>
        )}

        {!isLoading && products.length === 0 && !error && (
          <div className="text-gray-500">No products found. Try a different search term.</div>
        )}

        <div className="grid grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-w-1 aspect-h-1 bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 5C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5H7Z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium line-clamp-2 mb-1">{product.title}</h3>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {product.currency} {product.price}
                  </span>
                  <span className="text-xs text-gray-500">{product.merchant || product.brand}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-1.5 text-xs text-center border border-gray-200 rounded hover:bg-gray-50"
                  >
                    View Original
                  </a>
                  <button
                    onClick={() => handleFindDupes(product)}
                    className="flex-1 px-3 py-1.5 text-xs text-center bg-black text-white rounded hover:bg-gray-800"
                  >
                    Find Dupes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function Search() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
          </div>
        </div>
      </main>
    }>
      <SearchContent />
    </Suspense>
  );
} 