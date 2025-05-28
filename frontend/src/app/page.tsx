'use client';

import { useState } from 'react';
import { ThreadTwinAPI } from '@/services/api';
import { ProductDetails } from '@/types/product';
import { AxiosError } from 'axios';
import { LinkIcon, FabricIcon, SweaterIcon } from '@/components/Icons';
import ProductCard from '@/components/ProductCard';
import Image from 'next/image';

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
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="w-full border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">ThreadTwin</h1>
        <nav className="space-x-6">
          <a href="/" className="hover:underline">Home</a>
          <a href="/about" className="hover:underline">About</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="text-center p-8 border-b">
        <h2 className="text-2xl font-medium mb-4">Paste a product link or upload an image</h2>
        <div className="flex justify-center gap-4">
          <input 
            type="text" 
            placeholder="Find Dupes"
            className="input-primary w-96" 
          />
          <button className="btn-primary">Find Dupes</button>
        </div>
      </section>

      {/* How it Works */}
      <section className="p-8 border-b">
        <h3 className="text-xl font-medium mb-6 text-center">How it Works</h3>
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 mx-auto rounded-lg flex items-center justify-center mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="font-medium">Paste Link</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 mx-auto rounded-lg flex items-center justify-center mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-medium">Analyze Fabric</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 mx-auto rounded-lg flex items-center justify-center mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-medium">Find Dupes</p>
          </div>
        </div>
      </section>

      {/* Featured Dupes */}
      <section className="p-8">
        <h3 className="text-xl font-medium mb-6">Featured Dupes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { match: 80, quality: 'Very similar', price: 50 },
            { match: 64, quality: 'Good dupe', price: 45 },
            { match: 76, quality: 'Fair dupe', price: 33 },
          ].map((dupe, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="w-full h-48 bg-gray-100" />
              <div className="p-4">
                <p className="font-semibold">{dupe.match}% match</p>
                <p className="text-sm text-gray-600">{dupe.quality}</p>
                <p className="font-medium mt-1">${dupe.price}</p>
              </div>
            </div>
          ))}
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
    </div>
  );
} 