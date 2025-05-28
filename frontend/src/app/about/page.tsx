'use client';

import Link from 'next/link';
import { FaInstagram } from 'react-icons/fa';

export default function About() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <section className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">About ThreadTwin</h1>
          <p className="text-xl text-gray-600">
            Your AI-powered fashion companion for finding affordable alternatives to your favorite styles
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
            <p className="text-gray-600">
              At ThreadTwin, we believe that great style shouldn't come with a hefty price tag. 
              Our advanced AI technology analyzes clothing items to find similar alternatives, 
              helping you build your dream wardrobe without breaking the bank.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">How It Works</h2>
            <p className="text-gray-600">
              Our sophisticated algorithm analyzes fabric composition, construction details, 
              fit, and style elements to find the closest matches to your desired items. 
              We search through thousands of products to bring you the best dupes with 
              detailed similarity scores and quality ratings.
            </p>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold mb-3">The Creator</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                Created by Brianna Bogos
              </p>
              <p className="text-gray-600">
                Under Find The Perfect Outfit LLC
              </p>
              <div className="flex items-center space-x-2 text-gray-600">
                <Link 
                  href="https://instagram.com/briannabogoss" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-pink-500 hover:text-pink-600 transition-colors"
                >
                  <FaInstagram className="w-5 h-5" />
                  <span>@briannabogoss</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Start Finding Dupes
          </Link>
        </div>
      </section>
    </main>
  );
} 