'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="ThreadTwin Logo"
              width={140}
              height={32}
              priority
            />
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
              About
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About ThreadTwin</h1>
          
          <div className="space-y-6 text-gray-600">
            <p>
              ThreadTwin is an innovative fashion comparison tool that helps you find similar clothing items
              across different brands and price points. Our advanced AI technology analyzes the key
              characteristics of garments to find the closest matches.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Technology</h2>
            <p>
              We use cutting-edge machine learning algorithms to analyze various aspects of clothing items:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fabric composition and materials</li>
              <li>Fit and sizing characteristics</li>
              <li>Construction techniques and quality</li>
              <li>Style and design elements</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Help</h2>
            <p>
              Whether you're looking for a more affordable alternative to a designer piece or trying to find
              similar items in different colors or sizes, ThreadTwin helps you make informed shopping
              decisions by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comparing prices across different retailers</li>
              <li>Finding similar items at different price points</li>
              <li>Identifying high-quality alternatives</li>
              <li>Discovering new brands and styles</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 