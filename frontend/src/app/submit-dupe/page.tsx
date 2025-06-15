'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DupeSubmissionChat from '@/components/DupeSubmissionChat';

export default function SubmitDupePage() {
  const [showChat, setShowChat] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {!showChat ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Found a Great Dupe?
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Help others find affordable alternatives by sharing your fashion finds.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setShowChat(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Submit Your Dupe
              </button>
              <p className="text-sm text-gray-500">
                It only takes a minute to help others find great deals!
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Submit Your Dupe</h2>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <DupeSubmissionChat />
          </div>
        )}
      </div>
    </div>
  );
} 