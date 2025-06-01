'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [productUrl, setProductUrl] = useState('');
  const router = useRouter();

  const handleFindDupes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productUrl.trim()) return;

    // Check if input is a URL
    const isUrl = productUrl.startsWith('http://') || productUrl.startsWith('https://');

    if (isUrl) {
      // Handle direct product URL
      localStorage.setItem('originalProduct', JSON.stringify({ url: productUrl }));
      router.push('/product');
    } else {
      // Handle search query
      router.push(`/search?q=${encodeURIComponent(productUrl.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">ThreadTwin</h1>
            <div className="flex gap-6">
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</a>
              <a href="/about" className="text-sm text-gray-600 hover:text-gray-900">About</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-medium text-center mb-8">
            Paste a product link or upload an image
          </h2>
          <form onSubmit={handleFindDupes} className="w-full">
            <div className="flex gap-2 p-1 border border-gray-200 rounded-lg bg-white">
              <input
                type="text"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="Find Dupes"
                className="flex-1 px-4 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Find Dupes
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl font-medium mb-12">How It Works</h2>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium">Paste Link</h3>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm font-medium">Analyze Fabric</h3>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium">Find Dupes</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dupes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-xl font-medium">Featured Dupes</h2>
            <span className="text-sm text-gray-500">Series main</span>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-w-1 aspect-h-1 bg-gray-100">
                <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 5C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5H7Z" />
                </svg>
              </div>
              <div className="p-4">
                <div className="text-sm font-medium">80% match</div>
                <div className="text-xs text-gray-500">Very similar</div>
                <div className="mt-2 text-sm font-medium">$50</div>
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-w-1 aspect-h-1 bg-gray-100">
                <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 5C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5H7Z" />
                </svg>
              </div>
              <div className="p-4">
                <div className="text-sm font-medium">64% match</div>
                <div className="text-xs text-gray-500">Good dupe</div>
                <div className="mt-2 text-sm font-medium">$45</div>
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-w-1 aspect-h-1 bg-gray-100">
                <svg className="w-full h-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 5C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5H7Z" />
                </svg>
              </div>
              <div className="p-4">
                <div className="text-sm font-medium">76% match</div>
                <div className="text-xs text-gray-500">Fair dupe</div>
                <div className="mt-2 text-sm font-medium">$35</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 