import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [dupeUrl, setDupeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/compare`, {
        originalUrl,
        dupeUrl
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while comparing products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            ThreadTwin
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Find similar clothing items based on fabric composition, fit, and construction details.
          </p>
        </div>

        <form onSubmit={handleCompare} className="space-y-6">
          <div>
            <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700">
              Original Product URL
            </label>
            <input
              type="url"
              id="originalUrl"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              placeholder="https://example.com/product"
            />
          </div>

          <div>
            <label htmlFor="dupeUrl" className="block text-sm font-medium text-gray-700">
              Potential Dupe URL
            </label>
            <input
              type="url"
              id="dupeUrl"
              value={dupeUrl}
              onChange={(e) => setDupeUrl(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              placeholder="https://example.com/dupe-product"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Comparing...' : 'Compare Products'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {results && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Comparison Results</h2>
            {/* Add your results display here */}
          </div>
        )}
      </div>
    </main>
  );
} 