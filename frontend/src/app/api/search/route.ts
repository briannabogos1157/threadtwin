import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Configure axios with the correct backend URL
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    console.log('[API Debug] No query parameter provided');
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    console.log('[API Debug] Request details:', {
      url: `${BACKEND_URL}/api/products/search?query=${query}`,
      query,
      environment: process.env.NODE_ENV,
      backendUrl: BACKEND_URL,
      headers: api.defaults.headers
    });

    const response = await api.get(`/api/products/search?query=${query}`);
    
    console.log('[API Debug] Backend response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });

    const products = response.data.products || [];
    
    if (!products || products.length === 0) {
      console.log('[API Debug] No products found in response');
      return NextResponse.json({ products: [], message: 'No products found' });
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('[API Error]', error);
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Could not connect to the backend server. Please try again later.' },
        { status: 503 }
      );
    }
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to search products' },
      { status: error.response?.status || 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
} 