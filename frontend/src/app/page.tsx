'use client';

import { useState } from 'react';
import { ThreadTwinAPI } from '@/services/api';
import { ProductDetails } from '@/types/product';
import { AxiosError } from 'axios';
import { LinkIcon, FabricIcon, SweaterIcon } from '@/components/Icons';
import ProductCard from '@/components/ProductCard';

interface ErrorResponse {
  error: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProductDetails | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await ThreadTwinAPI.analyzeProduct(url);
      setResult(data);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setError(error.response?.data?.error || 'Failed to analyze product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 space-y-16">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Paste a product link or upload an image
        </h1>
        <form onSubmit={handleAnalyze} className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Find Dupes"
            className="flex-1 px-4 py-2 border rounded-l-lg text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded-r-lg text-lg font-medium disabled:opacity-50"
          >
            Find Dupes
          </button>
        </form>
      </section>

      {/* How it Works Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">How it Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-6 mb-4 flex justify-center">
              <LinkIcon />
            </div>
            <h3 className="text-xl font-semibold">Paste Link</h3>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-6 mb-4 flex justify-center">
              <FabricIcon />
            </div>
            <h3 className="text-xl font-semibold">Analyze Fabric</h3>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-6 mb-4 flex justify-center">
              <SweaterIcon />
            </div>
            <h3 className="text-xl font-semibold">Find Dupes</h3>
          </div>
        </div>
      </section>

      {/* Featured Dupes Section */}
      <section>
        <h2 className="text-3xl font-bold mb-8">Featured Dupes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ProductCard
            matchPercentage={80}
            matchQuality="Very similar"
            price={50}
          />
          <ProductCard
            matchPercentage={64}
            matchQuality="Good dupe"
            price={45}
          />
          <ProductCard
            matchPercentage={76}
            matchQuality="Fair dupe"
            price={33}
          />
        </div>
      </section>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
} 