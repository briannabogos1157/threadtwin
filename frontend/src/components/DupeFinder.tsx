'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  DUPE_POLL_INTERVAL_MS,
  dupeSearchIsFinished,
  dupeSearchMessage,
} from '@/lib/dupeSearchSession';
import { formatMatchCategory, formatMatchCoverage, formatMatchHeadline, type MatchConfidence, type MatchStatus } from '@/lib/formatMatch';

interface DupeSuggestion {
  name: string;
  retailer: string;
  url: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number | null;
  onSale?: boolean;
  fabric?: string;
  match?: {
    total: number;
    fabric: number | null;
    construction: number | null;
    fit: number | null;
    care: number | null;
    fabricStatus?: MatchStatus;
    constructionStatus?: MatchStatus;
    fitStatus?: MatchStatus;
    careStatus?: MatchStatus;
    fabricNote?: string;
    constructionNote?: string;
    fitNote?: string;
    careNote?: string;
    comparableFacets?: number;
    coverage?: number;
    confidence?: MatchConfidence;
  };
}

export default function DupeFinder() {
  const [luxuryItem, setLuxuryItem] = useState('');
  const [suggestions, setSuggestions] = useState<DupeSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef<number | null>(null);

  const stopPoll = () => {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPoll(), []);

  const applyUpdate = (data: {
    status?: string;
    outcome?: 'results' | 'none' | 'unusable';
    createdAt?: number;
    results?: DupeSuggestion[];
    error?: string;
  }) => {
    const status = data.status === 'complete' || data.status === 'unavailable' || data.status === 'searching'
      ? data.status
      : 'searching';
    const results = Array.isArray(data.results) ? data.results : [];
    const message = dupeSearchMessage({
      status,
      outcome: data.outcome,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      now: Date.now(),
      resultCount: results.length,
    });
    setStatusMessage(message);
    if (!dupeSearchIsFinished(status)) {
      setLoading(true);
      return;
    }
    stopPoll();
    setLoading(false);
    if (status === 'unavailable') {
      setError(data.error || message);
      setSuggestions(null);
      return;
    }
    setSuggestions(data.outcome === 'unusable' ? null : results);
  };

  const pollSearch = async (searchId: string) => {
    try {
      const response = await fetch(`/api/dupes/find/${encodeURIComponent(searchId)}`);
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          stopPoll();
          setLoading(false);
          setError('Dupe search is temporarily unavailable');
        }
        return;
      }
      applyUpdate(data);
    } catch {
      // A single status request can time out while Manus is still working.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    stopPoll();
    setLoading(true);
    setError('');
    setSuggestions(null);
    setStatusMessage('Searching for your twins…');

    try {
      const response = await fetch('/api/dupes/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: { name: luxuryItem } }),
      });
      const data = await response.json();
      if (!response.ok || !data?.searchId) {
        throw new Error(
          typeof data?.error === 'string' ? data.error : 'Dupe search is temporarily unavailable'
        );
      }
      applyUpdate(data);
      void pollSearch(data.searchId);
      pollRef.current = window.setInterval(() => {
        void pollSearch(data.searchId);
      }, DUPE_POLL_INTERVAL_MS);
    } catch (err) {
      stopPoll();
      setLoading(false);
      setStatusMessage('');
      setError(err instanceof Error ? err.message : 'Failed to find dupes. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Find Fashion Dupes</h2>
        <p className="text-gray-600">
          Enter a luxury fashion item and let our AI find affordable alternatives from popular retailers.
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
            placeholder="e.g., Skims Soft Lounge Long Slip Dress"
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
          {loading ? 'Searching…' : 'Find Dupes'}
        </button>
      </form>

      {statusMessage && (loading || !suggestions?.length) && !error ? (
        <p className="text-sm text-gray-600 mb-8">{statusMessage}</p>
      ) : null}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Suggested Dupes</h3>
          {suggestions.map((suggestion) => (
            <a
              key={suggestion.url}
              href={suggestion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white shadow rounded-lg p-6 border border-gray-200"
            >
              <h4 className="text-lg font-medium text-gray-900">{suggestion.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{suggestion.retailer}</p>
              <p className="mt-2 text-gray-900">
                {suggestion.price > 0 ? `$${suggestion.price}` : 'Price unavailable'}
                {suggestion.onSale && suggestion.originalPrice ? ` $${suggestion.originalPrice}` : ''}
              </p>
              {suggestion.fabric ? <p className="mt-2 text-gray-700">{suggestion.fabric}</p> : null}
              {suggestion.match ? (
                <div className="mt-2 text-sm text-gray-500 space-y-0.5">
                  <p>{formatMatchHeadline(suggestion.match.total, suggestion.match.confidence)}</p>
                  {formatMatchCoverage(suggestion.match.comparableFacets, suggestion.match.coverage) ? (
                    <p>{formatMatchCoverage(suggestion.match.comparableFacets, suggestion.match.coverage)}</p>
                  ) : null}
                  <p>{formatMatchCategory('Fabric', suggestion.match.fabric, suggestion.match.fabricStatus, suggestion.match.fabricNote)}</p>
                  <p>{formatMatchCategory('Construction', suggestion.match.construction, suggestion.match.constructionStatus, suggestion.match.constructionNote)}</p>
                  <p>{formatMatchCategory('Fit', suggestion.match.fit, suggestion.match.fitStatus, suggestion.match.fitNote)}</p>
                  <p>{formatMatchCategory('Care', suggestion.match.care, suggestion.match.careStatus, suggestion.match.careNote)}</p>
                </div>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
} 