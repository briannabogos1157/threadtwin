'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import '../../config/axios';
import { useRouter } from 'next/navigation';
import { blockStatusLine, isBlockedAnalysis, savedProductFromRecord } from '@/lib/blockedProduct';
import { dupeSearchBody } from '@/lib/dupeSearchRequest';
import { formatMatchCategory, formatMatchCoverage, formatMatchHeadline, type MatchConfidence, type MatchStatus } from '@/lib/formatMatch';
import {
  clearDupeSearch,
  DUPE_POLL_INTERVAL_MS,
  dupeSearchIsFinished,
  dupeSearchMessage,
  loadDupeSearch,
  rememberDupeSearch,
} from '@/lib/dupeSearchSession';
import { fetchProductAnalysis } from '@/lib/fetchProductAnalysis';
import { formatMaterialLabel } from '@/lib/formatMaterialLabel';

interface ProductDetails {
  name: string;
  price: number;
  originalPrice?: number | null;
  onSale?: boolean;
  availability?: string;
  description: string;
  imageUrl: string;
  url: string;
  fabric?: string;
  fabricComposition?: string[];
  fit?: string[];
  construction?: string[];
  care?: string[];
  productType?: string;
  retailer?: string;
}

interface DupeResult {
  name: string;
  retailer: string;
  url: string;
  imageUrl: string;
  price: number;
  originalPrice: number | null;
  onSale: boolean;
  fabric: string;
  match: MatchBreakdown;
}

interface MatchBreakdown {
  fabric: number | null;
  construction: number | null;
  fit: number | null;
  care: number | null;
  total: number;
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
}

interface ComparisonResult {
  original: ProductDetails;
  dupe: ProductDetails;
  matchBreakdown: MatchBreakdown;
}

function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function normalizeShopUrl(raw: string): string {
  const u = raw.trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function comparedProduct(raw: Record<string, unknown>, fallbackUrl: string): ProductDetails {
  const price = typeof raw.price === 'number' ? raw.price : parseFloat(String(raw.price ?? '0')) || 0;
  const originalRaw = raw.originalPrice;
  const originalPrice = typeof originalRaw === 'number' && originalRaw > price ? originalRaw : null;
  const fabricSource =
    typeof raw.fabric === 'string' && raw.fabric
      ? raw.fabric
      : typeof raw.materialSummary === 'string'
        ? raw.materialSummary
        : Array.isArray(raw.fabricComposition)
          ? raw.fabricComposition.filter((part): part is string => typeof part === 'string').join(', ')
          : '';
  const images = raw.images;
  const imageUrl =
    typeof raw.imageUrl === 'string' && raw.imageUrl
      ? raw.imageUrl
      : Array.isArray(images) && typeof images[0] === 'string'
        ? images[0]
        : '';

  return {
    name: String(raw.name ?? ''),
    price,
    originalPrice,
    onSale: raw.onSale === true && originalPrice != null,
    availability: typeof raw.availability === 'string' ? raw.availability : '',
    description: String(raw.description ?? ''),
    imageUrl,
    url: typeof raw.url === 'string' && raw.url ? raw.url : fallbackUrl,
    fabric: fabricSource || undefined,
  };
}

function ComparedProduct({ product, label }: { product: ProductDetails; label: string }) {
  const materialLabel = formatMaterialLabel(product.fabric);
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">{label}</p>
      <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg mb-4 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="object-contain w-full h-64 rounded-lg bg-gray-100" />
        ) : (
          <div className="w-full h-64" />
        )}
      </div>
      <h3 className="text-lg font-medium">{product.name}</h3>
      {product.onSale ? (
        <p className="text-xs font-medium uppercase tracking-wide text-red-600 mt-2">Sale</p>
      ) : null}
      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-sm font-medium">
          {product.price > 0 ? formatUsd(product.price) : 'Price unavailable'}
        </p>
        {product.onSale && product.originalPrice ? (
          <p className="text-sm text-gray-400 line-through">{formatUsd(product.originalPrice)}</p>
        ) : null}
      </div>
      {materialLabel ? <p className="text-sm text-gray-500 mt-2">{materialLabel}</p> : null}
      {label === 'Dupe' && product.url ? (
        <p className="text-sm text-blue-600 mt-3">View product</p>
      ) : null}
    </>
  );

  if (label === 'Dupe' && product.url) {
    return (
      <a href={product.url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90">
        {body}
      </a>
    );
  }

  return <div>{body}</div>;
}

function rememberProduct(product: ProductDetails) {
  localStorage.setItem(
    'originalProduct',
    JSON.stringify({
      url: product.url,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      onSale: product.onSale === true,
      availability: product.availability ?? '',
      description: product.description,
      imageUrl: product.imageUrl,
      fabric: product.fabric ?? '',
      fabricComposition: product.fabricComposition ?? [],
      fit: product.fit ?? [],
      construction: product.construction ?? [],
      care: product.care ?? [],
      productType: product.productType ?? '',
      retailer: product.retailer ?? '',
    })
  );
}

export default function Product() {
  const router = useRouter();
  const [originalProduct, setOriginalProduct] = useState<ProductDetails | null>(null);
  const [retailerUrl, setRetailerUrl] = useState('');
  const [refreshBlocked, setRefreshBlocked] = useState(false);
  const [dupeUrl, setDupeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [searchError, setSearchError] = useState('');
  const [dupeResults, setDupeResults] = useState<DupeResult[] | null>(null);
  const pollRef = useRef<number | null>(null);
  const [error, setError] = useState('');
  /** Live scrape failed. Saved details, when present, stay on the product card. */
  const [notice, setNotice] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    const apply = (update: () => void) => {
      if (!cancelled) update();
    };

    try {
      const storedProduct = localStorage.getItem('originalProduct');
      if (!storedProduct) {
        apply(() => {
          setError('No product selected. Please return to the home page.');
          setIsLoading(false);
        });
        return () => {
          cancelled = true;
        };
      }

      const productData = JSON.parse(storedProduct) as Record<string, unknown>;
      const rawUrl = String(productData.url ?? productData.productUrl ?? '').trim();
      const shopUrl = normalizeShopUrl(rawUrl);

      if (!shopUrl) {
        apply(() => {
          setError('Invalid product data. Please try again.');
          setIsLoading(false);
        });
        return () => {
          cancelled = true;
        };
      }

      const savedNow = savedProductFromRecord(productData, shopUrl);
      if (savedNow) {
        apply(() => {
          setOriginalProduct(savedNow);
          setRetailerUrl(shopUrl);
          setIsLoading(false);
        });
      }

      fetchProductAnalysis(shopUrl)
        .then((result) => {
          apply(() => {
            setRetailerUrl(shopUrl);
            if (!result.ok) {
              const saved = savedProductFromRecord(productData, shopUrl);
              const blockedRefresh = isBlockedAnalysis(result.error);
              const reason = blockStatusLine(result.error);
              setRefreshBlocked(blockedRefresh);
              setOriginalProduct(saved);
              setNotice(
                saved
                  ? `Live product details could not be refreshed. ${reason} Showing saved details.`
                  : `Live product details could not be refreshed. ${reason}`
              );
              setError('');
              return;
            }
            setOriginalProduct(result.product);
            rememberProduct(result.product);
            setRefreshBlocked(false);
            setError('');
            setNotice('');
          });
        })
        .catch((err) => {
          console.error('Error fetching product details:', err);
          apply(() => {
            const saved = savedProductFromRecord(productData, shopUrl);
            setRetailerUrl(shopUrl);
            setRefreshBlocked(false);
            setOriginalProduct(saved);
            setNotice(
              saved
                ? 'Live product details could not be refreshed. Showing saved details.'
                : 'Live product details could not be refreshed. The product page could not be read.'
            );
            setError('');
          });
        })
        .finally(() => {
          apply(() => setIsLoading(false));
        });
    } catch (err) {
      console.error('Error processing product data:', err);
      apply(() => {
        setError('An error occurred. Please try again.');
        setIsLoading(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const stopPoll = () => {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const applySearchUpdate = (data: {
    status?: string;
    outcome?: 'results' | 'none' | 'unusable';
    createdAt?: number;
    results?: DupeResult[];
    error?: string;
  }) => {
    const status = data.status === 'complete' || data.status === 'unavailable' || data.status === 'searching'
      ? data.status
      : 'searching';
    const createdAt = typeof data.createdAt === 'number' ? data.createdAt : Date.now();
    const results = Array.isArray(data.results) ? data.results : [];
    const message = dupeSearchMessage({
      status,
      outcome: data.outcome,
      createdAt,
      now: Date.now(),
      resultCount: results.length,
    });
    setSearchMessage(message);
    if (!dupeSearchIsFinished(status)) {
      setSearching(true);
      return;
    }
    stopPoll();
    setSearching(false);
    if (status === 'unavailable') {
      setSearchError(data.error || message);
      setDupeResults(null);
      return;
    }
    setSearchError('');
    setDupeResults(data.outcome === 'unusable' ? null : results);
  };

  const pollSearch = async (searchId: string) => {
    try {
      const response = await axios.get(`/api/dupes/find/${encodeURIComponent(searchId)}`);
      applySearchUpdate(response.data);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        stopPoll();
        setSearching(false);
        setSearchError('Dupe search is temporarily unavailable');
        clearDupeSearch();
        return;
      }
    }
  };

  const beginPolling = (searchId: string) => {
    stopPoll();
    void pollSearch(searchId);
    pollRef.current = window.setInterval(() => {
      void pollSearch(searchId);
    }, DUPE_POLL_INTERVAL_MS);
  };

  useEffect(() => {
    const url = originalProduct?.url;
    if (!url) return undefined;
    const searchId = loadDupeSearch(url);
    if (searchId) beginPolling(searchId);
    return () => stopPoll();
  }, [originalProduct?.url]);

  const handleFindDupes = async () => {
    if (!originalProduct?.name || searching) return;
    setSearching(true);
    setSearchError('');
    setDupeResults(null);
    setSearchMessage('Searching for your twins…');

    try {
      const response = await axios.post('/api/dupes/find', dupeSearchBody(originalProduct));
      const data = response.data as { searchId?: string; status?: string; error?: string; createdAt?: number };
      if (!data.searchId || data.status === 'unavailable') {
        setSearching(false);
        setSearchMessage('');
        setSearchError(data.error || 'Dupe search is temporarily unavailable');
        return;
      }
      rememberDupeSearch(originalProduct.url, data.searchId);
      applySearchUpdate(data);
      beginPolling(data.searchId);
    } catch (err: any) {
      setSearching(false);
      setSearchMessage('');
      const message = err.response?.data?.error;
      setSearchError(
        typeof message === 'string' && message
          ? message
          : 'Dupe search is temporarily unavailable'
      );
    }
  };

  const handleCompare = async () => {
    if (!dupeUrl || !originalProduct?.url) {
      setError('Please enter a dupe product URL');
      return;
    }

    setComparing(true);
    setError('');

    try {
      const response = await axios.post('/api/compare', {
        originalUrl: originalProduct.url,
        dupeUrl
      });
      const data = response.data as {
        original?: Record<string, unknown>;
        dupe?: Record<string, unknown>;
        matchBreakdown?: MatchBreakdown;
      };
      if (!data.original || !data.dupe || !data.matchBreakdown) {
        setError('The comparison did not include both products.');
        setComparisonResult(null);
        return;
      }
      setComparisonResult({
        original: comparedProduct(data.original, originalProduct.url),
        dupe: comparedProduct(data.dupe, dupeUrl.trim()),
        matchBreakdown: data.matchBreakdown,
      });
    } catch (err: any) {
      console.error('Comparison error:', err);
      const d = err.response?.data;
      const msg = [d?.error, d?.details].filter(Boolean).join(' — ');
      setError(msg || 'Failed to compare products');
      setComparisonResult(null);
    } finally {
      setComparing(false);
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

  if (error && !originalProduct) {
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

  if (!originalProduct && retailerUrl) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-medium mb-3">Live product details could not be refreshed</h2>
          <p className="text-gray-600 mb-3">
            {refreshBlocked
              ? 'This retailer blocked the product page. Thread Twin does not have a name, price, or photo to show.'
              : 'Thread Twin could not read this product page, and there are no saved details to show.'}
          </p>
          <p className="text-sm text-gray-500 mb-8 break-all">{retailerUrl}</p>
          <div className="flex justify-center gap-3">
            <a
              href={retailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
            >
              Open retailer page
            </a>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
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

  const materialLabel = formatMaterialLabel(originalProduct.fabric);

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

      {notice ? (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>{notice}</p>
            {retailerUrl ? (
              <a
                href={retailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-medium underline"
              >
                Open retailer page
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

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
            <h3 className="text-lg font-medium">{originalProduct.name}</h3>
            {originalProduct.onSale ? (
              <p className="text-xs font-medium uppercase tracking-wide text-red-600 mt-2">Sale</p>
            ) : null}
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-sm font-medium">
                {originalProduct.price > 0 ? formatUsd(originalProduct.price) : 'Price unavailable'}
              </p>
              {originalProduct.onSale && originalProduct.originalPrice ? (
                <p className="text-sm text-gray-400 line-through">{formatUsd(originalProduct.originalPrice)}</p>
              ) : null}
            </div>
            {originalProduct.availability ? (
              <p className="text-sm text-gray-500 mt-2">{originalProduct.availability}</p>
            ) : null}
            {materialLabel ? (
              <p className="text-sm text-gray-500 mt-2">{materialLabel}</p>
            ) : null}
            {originalProduct.description ? (
              <p className="text-sm text-gray-600 mt-3">{originalProduct.description}</p>
            ) : null}
          </div>

          {/* Dupe Search */}
          <div className="col-span-9">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium">Find Dupes</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Fabric</span>
                {materialLabel ? (
                  <span className="text-sm text-gray-500">{materialLabel}</span>
                ) : null}
                <button
                  onClick={handleFindDupes}
                  disabled={searching}
                  className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {searching ? 'Searching…' : 'Find Dupes'}
                </button>
              </div>
            </div>

            {searching && searchMessage ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 mb-8">
                {searchMessage}
              </div>
            ) : null}

            {!searching && !searchError && searchMessage && !(dupeResults && dupeResults.length > 0) ? (
              <p className="text-sm text-gray-600 mb-8">{searchMessage}</p>
            ) : null}

            {searchError ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-8">
                {searchError}
              </div>
            ) : null}

            {dupeResults && dupeResults.length > 0 ? (
              <div className="mb-10">
                <p className="text-sm font-medium text-gray-900 mb-4">Results found</p>
              <div className="grid grid-cols-2 gap-4">
                {dupeResults.map((result) => (
                  <a
                    key={result.url}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-400"
                  >
                    <div className="bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      {result.imageUrl ? (
                        <img src={result.imageUrl} alt={result.name} className="object-contain w-full h-48 bg-gray-100" />
                      ) : (
                        <div className="w-full h-48" />
                      )}
                    </div>
                    <h3 className="text-sm font-medium">{result.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{result.retailer}</p>
                    {result.onSale ? (
                      <p className="text-xs font-medium uppercase tracking-wide text-red-600 mt-2">Sale</p>
                    ) : null}
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-sm font-medium">
                        {result.price > 0 ? formatUsd(result.price) : 'Price unavailable'}
                      </p>
                      {result.onSale && result.originalPrice ? (
                        <p className="text-sm text-gray-400 line-through">{formatUsd(result.originalPrice)}</p>
                      ) : null}
                    </div>
                    {result.fabric ? (
                      <p className="text-sm text-gray-500 mt-2">{formatMaterialLabel(result.fabric)}</p>
                    ) : null}
                    <p className="text-sm font-medium mt-3">{formatMatchHeadline(result.match.total, result.match.confidence)}</p>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {formatMatchCoverage(result.match.comparableFacets, result.match.coverage) ? (
                        <p>{formatMatchCoverage(result.match.comparableFacets, result.match.coverage)}</p>
                      ) : null}
                      <p>{formatMatchCategory('Fabric', result.match.fabric, result.match.fabricStatus, result.match.fabricNote)}</p>
                      <p>{formatMatchCategory('Construction', result.match.construction, result.match.constructionStatus, result.match.constructionNote)}</p>
                      <p>{formatMatchCategory('Fit', result.match.fit, result.match.fitStatus, result.match.fitNote)}</p>
                      <p>{formatMatchCategory('Care', result.match.care, result.match.careStatus, result.match.careNote)}</p>
                    </div>
                  </a>
                ))}
              </div>
              </div>
            ) : null}

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Compare a specific product</h3>
              <div className="flex gap-2 mb-8">
                <input
                  type="text"
                  value={dupeUrl}
                  onChange={(e) => setDupeUrl(e.target.value)}
                  placeholder="Paste a product URL to compare"
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <button
                  onClick={handleCompare}
                  disabled={comparing}
                  className="px-6 py-2 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {comparing ? 'Comparing…' : 'Compare'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 mb-6">{error}</div>
            )}

            {comparisonResult && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-8">
                  <ComparedProduct product={comparisonResult.original} label="Original" />
                  <ComparedProduct product={comparisonResult.dupe} label="Dupe" />
                </div>
                <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{formatMatchHeadline(comparisonResult.matchBreakdown.total, comparisonResult.matchBreakdown.confidence)}</p>
                  <div className="mt-1 space-y-0.5">
                    {formatMatchCoverage(comparisonResult.matchBreakdown.comparableFacets, comparisonResult.matchBreakdown.coverage) ? (
                      <p>{formatMatchCoverage(comparisonResult.matchBreakdown.comparableFacets, comparisonResult.matchBreakdown.coverage)}</p>
                    ) : null}
                    <p>{formatMatchCategory('Fabric', comparisonResult.matchBreakdown.fabric, comparisonResult.matchBreakdown.fabricStatus, comparisonResult.matchBreakdown.fabricNote)}</p>
                    <p>{formatMatchCategory('Construction', comparisonResult.matchBreakdown.construction, comparisonResult.matchBreakdown.constructionStatus, comparisonResult.matchBreakdown.constructionNote)}</p>
                    <p>{formatMatchCategory('Fit', comparisonResult.matchBreakdown.fit, comparisonResult.matchBreakdown.fitStatus, comparisonResult.matchBreakdown.fitNote)}</p>
                    <p>{formatMatchCategory('Care', comparisonResult.matchBreakdown.care, comparisonResult.matchBreakdown.careStatus, comparisonResult.matchBreakdown.careNote)}</p>
                  </div>
                  <p className="mt-2 text-gray-500">
                    The match uses fabric, construction, fit, and care. The current price and any crossed-out original price are shown separately and are not part of the score.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 