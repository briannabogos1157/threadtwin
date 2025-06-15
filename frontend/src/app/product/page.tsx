'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import '../../config/axios';
import { useRouter } from 'next/navigation';

interface ProductDetails {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  url: string;
  fabric?: string;
}

interface MatchBreakdown {
  fabric: number;
  construction: number;
  fit: number;
  care: number;
  total: number;
}

interface ComparisonResult {
  original: ProductDetails;
  dupe: ProductDetails;
  matchBreakdown: MatchBreakdown;
}

export default function Product() {
  const router = useRouter();
  const [originalProduct, setOriginalProduct] = useState<ProductDetails | null>(null);
  const [dupeUrl, setDupeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    try {
      const storedProduct = localStorage.getItem('originalProduct');
      if (!storedProduct) {
        setError('No product selected. Please return to the home page.');
        setIsLoading(false);
        return;
      }

      const productData = JSON.parse(storedProduct);
      if (!productData.url) {
        setError('Invalid product data. Please try again.');
        setIsLoading(false);
        return;
      }

      // Fetch product details from the backend
      const fetchProductDetails = async () => {
        try {
          const response = await fetch(`/api/products/details?url=${encodeURIComponent(productData.url)}`);
          if (!response.ok) {
            throw new Error('Failed to fetch product details');
          }
          const data = await response.json();
          setOriginalProduct(data);
        } catch (err) {
          console.error('Error fetching product details:', err);
          setError('Failed to load product details. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchProductDetails();
    } catch (err) {
      console.error('Error processing product data:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  }, []);

  const handleCompare = async () => {
    if (!dupeUrl || !originalProduct?.url) {
      setError('Please enter a dupe product URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/compare', {
        originalUrl: originalProduct.url,
        dupeUrl
      });
      setComparisonResult(response.data);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.response?.data?.error || 'Failed to compare products');
    } finally {
      setIsLoading(false);
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

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-medium mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Return to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!originalProduct) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-medium mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-6">The requested product could not be found.</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Return to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">ThreadTwin</h1>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</a>
              <a href="/about" className="text-sm text-gray-600 hover:text-gray-900">About</a>
              <input
                type="text"
                placeholder="Search"
                className="px-4 py-1 text-sm border border-gray-200 rounded-lg"
              />
              <button className="p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Original Product */}
          <div className="col-span-3">
            <h2 className="text-xl font-medium mb-6">Original Product</h2>
            <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg mb-4">
              {originalProduct?.imageUrl ? (
                <img
                  src={originalProduct.imageUrl}
                  alt={originalProduct.name}
                  className="object-cover w-full h-full rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 5C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5H7Z" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="text-lg font-medium">{originalProduct?.name}</h3>
            <p className="text-sm text-gray-500 mt-2">
              {originalProduct?.fabric || '50% Material, 50% Material'}
            </p>
            <p className="text-sm font-medium mt-4">${originalProduct?.price || 0}</p>
          </div>

          {/* Dupe Search */}
          <div className="col-span-9">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Find a Dupe</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Fabric</span>
                <span className="text-sm text-gray-500">50% Material, 50% Material</span>
              </div>
            </div>

            <div className="flex gap-2 mb-8">
              <input
                type="text"
                value={dupeUrl}
                onChange={(e) => setDupeUrl(e.target.value)}
                placeholder="Paste dupe product URL"
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <button
                onClick={handleCompare}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Compare
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 mb-6">{error}</div>
            )}

            {comparisonResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg mb-4">
                        <img
                          src={comparisonResult.dupe.imageUrl}
                          alt={comparisonResult.dupe.name}
                          className="object-cover w-full h-full rounded-lg"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium">{comparisonResult.matchBreakdown.total}% match</div>
                          <div className="text-xs text-gray-500">
                            {comparisonResult.matchBreakdown.total >= 90 ? 'Excellent match' :
                             comparisonResult.matchBreakdown.total >= 80 ? 'Very similar' :
                             comparisonResult.matchBreakdown.total >= 70 ? 'Good dupe' : 'Fair dupe'}
                          </div>
                        </div>
                        <div className="text-sm font-medium">${comparisonResult.dupe.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 