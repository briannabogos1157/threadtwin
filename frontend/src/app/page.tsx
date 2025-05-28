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
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Find Your Perfect Style Twin
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover affordable alternatives to your favorite fashion pieces with our AI-powered matching system.
          </p>
          <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto">
            <div className="flex gap-2 shadow-lg rounded-full bg-white p-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a product URL"
                className="flex-1 px-6 py-3 text-lg border-none focus:ring-0 rounded-full"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-black text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  'Find Dupes'
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="bg-gray-50 rounded-2xl p-8 mb-4 flex justify-center items-center transform hover:scale-105 transition-transform">
                <LinkIcon className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-semibold">Paste Link</h3>
              <p className="text-gray-600">Share your favorite fashion piece with us</p>
            </div>
            <div className="text-center space-y-4">
              <div className="bg-gray-50 rounded-2xl p-8 mb-4 flex justify-center items-center transform hover:scale-105 transition-transform">
                <FabricIcon className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-semibold">Smart Analysis</h3>
              <p className="text-gray-600">Our AI analyzes fabric, style, and construction</p>
            </div>
            <div className="text-center space-y-4">
              <div className="bg-gray-50 rounded-2xl p-8 mb-4 flex justify-center items-center transform hover:scale-105 transition-transform">
                <SweaterIcon className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-semibold">Find Matches</h3>
              <p className="text-gray-600">Get personalized dupe recommendations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dupes Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Featured Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProductCard
              matchPercentage={92}
              matchQuality="Excellent Match"
              price={79}
              imageUrl="/featured-1.jpg"
            />
            <ProductCard
              matchPercentage={87}
              matchQuality="Great Alternative"
              price={65}
              imageUrl="/featured-2.jpg"
            />
            <ProductCard
              matchPercentage={83}
              matchQuality="Smart Choice"
              price={49}
              imageUrl="/featured-3.jpg"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 text-red-700 px-6 py-4 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {result && (
        <section className="max-w-4xl mx-auto mt-16 px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Analysis Results</h2>
            <div className="bg-gray-50 p-6 rounded-xl overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      )}
    </main>
  );
} 