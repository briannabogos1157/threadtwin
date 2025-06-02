'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Dupe {
  id: string;
  original_product: string;
  dupe_product: string;
  price_comparison: string;
  similarity_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminDupesPage() {
  const [dupes, setDupes] = useState<Dupe[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDupes();
  }, [statusFilter]);

  const fetchDupes = async () => {
    try {
      const response = await fetch(`/api/dupes?status=${statusFilter}`);
      if (!response.ok) throw new Error('Failed to fetch dupes');
      const data = await response.json();
      setDupes(data);
    } catch (error) {
      console.error('Error fetching dupes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDupeStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dupes/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      // Refresh the list
      fetchDupes();
    } catch (error) {
      console.error('Error updating dupe status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dupe Submissions</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {dupes.map((dupe) => (
                <li key={dupe.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        Original: {dupe.original_product}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Dupe: {dupe.dupe_product}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Price Comparison: {dupe.price_comparison}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Similarity: {dupe.similarity_reason}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Submitted: {new Date(dupe.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      {dupe.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateDupeStatus(dupe.id, 'approved')}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateDupeStatus(dupe.id, 'rejected')}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {dupe.status !== 'pending' && (
                        <span className={`px-4 py-2 rounded-md ${
                          dupe.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {dupe.status.charAt(0).toUpperCase() + dupe.status.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 