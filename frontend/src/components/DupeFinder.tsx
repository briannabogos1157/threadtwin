import React, { useState } from 'react';

interface DupeSuggestion {
  title: string;
  retailer: string;
  price: string;
  description: string;
  productLink: string;
}

export default function DupeFinder() {
  const [luxuryItem, setLuxuryItem] = useState('');
  const [suggestions, setSuggestions] = useState<DupeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const response = await fetch('/api/dupes/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          luxuryItem,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find dupes');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      setError('Failed to find dupes. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Find Fashion Dupes</h2>
        <p className="text-gray-600">
          Enter a luxury fashion item and let our AI find affordable alternatives.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label htmlFor="luxuryItem" className="block text-sm font-medium text-gray-700">
            Luxury Item to Find Dupes For
          </label>
          <input
            type="text"
            id="luxuryItem"
            value={luxuryItem}
            onChange={(e) => setLuxuryItem(e.target.value)}
            placeholder="e.g., Reformation Nikita Dress"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? 'Finding Dupes...' : 'Find Dupes'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Suggested Dupes</h3>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white shadow rounded-lg p-6 border border-gray-200"
            >
              <h4 className="text-lg font-medium text-gray-900">{suggestion.title}</h4>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Retailer</p>
                  <p className="text-gray-900">{suggestion.retailer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-gray-900">{suggestion.price}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700">{suggestion.description}</p>
              </div>
              <div className="mt-4">
                <a
                  href={suggestion.productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Product →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 