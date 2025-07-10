import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.threadtwin.com';

// Configure axios with the correct backend URL
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('[Analyze API] Analyzing product URL:', url);
    
    // Use the backend analyze endpoint
    const response = await api.post('/api/analyze', { url });
    
    console.log('[Analyze API] Analysis response:', {
      status: response.status,
      data: response.data
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[Analyze API] Error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Could not connect to the backend server. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to analyze product' },
      { status: error.response?.status || 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
} 