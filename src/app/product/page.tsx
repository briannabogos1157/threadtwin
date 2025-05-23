'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThreadTwinAPI } from '@/services/api';
import MatchBadge from '@/components/MatchBadge';

interface DupeResult {
  name: string;
  price: number;
  match: number;
  image?: string;
}

export default function Product() {
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [dupeUrl, setDupeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  useEffect(() => {
    // Load the original product from localStorage
    const savedProduct = localStorage.getItem('originalProduct');
    if (savedProduct) {
      setOriginalProduct(JSON.parse(savedProduct));
    }
  }, []);

  const handleCompare = async () => {
    if (!dupeUrl) {
      setError('Please enter a dupe product URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await ThreadTwinAPI.compareProducts(originalProduct.url, dupeUrl);
      setComparisonResult(result);
    } catch (err) {
      setError('Failed to compare products. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!originalProduct) {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <p>No product selected. Please return to the <Link href="/" className="text-primary hover:underline">home page</Link>.</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">{originalProduct.name || 'Product Analysis'}</h1>
        <nav className="space-x-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/about" className="hover:underline">About</Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-4">
          {originalProduct.images?.[0] ? (
            <img 
              src={originalProduct.images[0]} 
              alt={originalProduct.name}
              className="w-full h-40 object-cover rounded-lg mb-4"
            />
          ) : (
            <div className="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
          )}
          <div className="space-y-2">
            <p className="font-semibold">{originalProduct.name}</p>
            <p className="text-gray-600">
              {originalProduct.fabricComposition.join(', ')}
            </p>
            <p className="font-medium">${originalProduct.price}</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="border rounded-lg p-4">
            <p className="font-medium mb-2">Fabric Composition</p>
            <p>{originalProduct.fabricComposition.join(', ')}</p>
            
            <div className="mt-4 space-y-2">
              <p className="font-medium">Construction</p>
              <p>{originalProduct.construction.join(', ') || 'Not specified'}</p>
            </div>

            <div className="mt-4 space-y-2">
              <p className="font-medium">Fit</p>
              <p>{originalProduct.fit.join(', ') || 'Not specified'}</p>
            </div>

            <div className="mt-4 space-y-2">
              <p className="font-medium">Care Instructions</p>
              <p>{originalProduct.careInstructions.join(', ') || 'Not specified'}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Compare with a Dupe</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={dupeUrl}
                  onChange={(e) => setDupeUrl(e.target.value)}
                  placeholder="Paste dupe product URL"
                  className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={handleCompare}
                  disabled={isLoading}
                  className={`btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Comparing...' : 'Compare'}
                </button>
              </div>
              
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {comparisonResult && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Comparison Results</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center border rounded-lg p-2">
                      <p className="text-sm font-medium">Fabric Match</p>
                      <MatchBadge score={comparisonResult.matchBreakdown.fabric} />
                    </div>
                    <div className="text-center border rounded-lg p-2">
                      <p className="text-sm font-medium">Fit Match</p>
                      <MatchBadge score={comparisonResult.matchBreakdown.fit} />
                    </div>
                    <div className="text-center border rounded-lg p-2">
                      <p className="text-sm font-medium">Construction</p>
                      <MatchBadge score={comparisonResult.matchBreakdown.construction} />
                    </div>
                    <div className="text-center border rounded-lg p-2">
                      <p className="text-sm font-medium">Care Match</p>
                      <MatchBadge score={comparisonResult.matchBreakdown.care} />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{comparisonResult.dupe.name}</h5>
                        <p className="text-sm text-gray-600">${comparisonResult.dupe.price}</p>
                      </div>
                      <MatchBadge 
                        score={comparisonResult.matchBreakdown.total}
                        showTooltip={true}
                        breakdown={comparisonResult.matchBreakdown}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 