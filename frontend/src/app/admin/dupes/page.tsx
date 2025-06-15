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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDupes, setSelectedDupes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const router = useRouter();

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchDupes();
  }, [statusFilter, currentPage, sortBy, sortOrder, searchQuery]);

  const fetchDupes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/dupes?status=${statusFilter}&page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${searchQuery}`
      );
      if (!response.ok) throw new Error('Failed to fetch dupes');
      const data = await response.json();
      setDupes(data.items);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching dupes:', error);
      setError('Failed to load submissions. Please try again.');
      showNotificationMessage('Failed to load submissions', 'error');
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
      
      showNotificationMessage(`Submission ${newStatus} successfully`, 'success');
      fetchDupes();
    } catch (error) {
      console.error('Error updating dupe status:', error);
      showNotificationMessage('Failed to update status', 'error');
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/dupes/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedDupes,
          status: action
        }),
      });

      if (!response.ok) throw new Error('Failed to update submissions');
      
      showNotificationMessage(`Successfully ${action}ed ${selectedDupes.length} submissions`, 'success');
      setSelectedDupes([]);
      fetchDupes();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showNotificationMessage('Failed to update submissions', 'error');
    }
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDupes(dupes.map(dupe => dupe.id));
    } else {
      setSelectedDupes([]);
    }
  };

  const handleSelectDupe = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDupes([...selectedDupes, id]);
    } else {
      setSelectedDupes(selectedDupes.filter(dupeId => dupeId !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {showNotification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md ${
          notificationType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notificationMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dupe Submissions</h1>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as 'created_at' | 'status');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="status-asc">Status A-Z</option>
              <option value="status-desc">Status Z-A</option>
            </select>
          </div>
        </div>

        {selectedDupes.length > 0 && (
          <div className="mb-4 flex items-center space-x-4">
            <span className="text-sm text-gray-600">{selectedDupes.length} selected</span>
            <button
              onClick={() => handleBulkAction('approve')}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Reject Selected
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {dupes.map((dupe) => (
                  <li key={dupe.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedDupes.includes(dupe.id)}
                          onChange={(e) => handleSelectDupe(dupe.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
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

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Showing {dupes.length} of {totalPages * ITEMS_PER_PAGE} submissions
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 