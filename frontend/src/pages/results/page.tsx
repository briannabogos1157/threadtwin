'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MatchBadge from '@/components/MatchBadge';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  url: string;
  title: string;
  image: string;
  price: string;
  fabric: string[];
  fit: string[];
  care: string[];
  construction: string[];
}

interface ComparisonResult {
  originalProduct: Product;
  similarProducts: {
    product: Product;
    scores: {
      fabric: number;
      fit: number;
      care: number;
      construction: number;
      total: number;
    };
  }[];
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = React.useState<ComparisonResult | null>(null);
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchResults = async () => {
      const id = searchParams.get('id');
      if (!id) {
        setError('No product ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/results/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError('Failed to load results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/" className="text-blue-600 hover:underline">
            Try Again
          </a>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Similar Products</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Original Product</h2>
          <ProductCard product={results.originalProduct} />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Matches</h2>
          {results.similarProducts.map(({ product, scores }, index) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <ProductCard product={product} />
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-4">Match Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MatchBadge
                      label="Fabric"
                      score={scores.fabric}
                      weight={0.4}
                    />
                    <MatchBadge
                      label="Construction"
                      score={scores.construction}
                      weight={0.25}
                    />
                    <MatchBadge
                      label="Fit"
                      score={scores.fit}
                      weight={0.25}
                    />
                    <MatchBadge
                      label="Care"
                      score={scores.care}
                      weight={0.1}
                    />
                  </div>
                  <div className="mt-6">
                    <MatchBadge
                      label="Overall Match"
                      score={scores.total}
                      weight={1.0}
                      large
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function Results() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
} 