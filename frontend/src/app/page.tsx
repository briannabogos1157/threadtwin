'use client';

import { useState } from 'react';
import { ThreadTwinAPI } from '@/services/api';
import { ProductDetails } from '@/types/product';
import { AxiosError } from 'axios';

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
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">ThreadTwin</h1>
      <form onSubmit={handleAnalyze} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            Product URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter product URL"
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Product'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
} 