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

export async function GET(request: NextRequest) {
  try {
    console.log('[Affiliate API] GET request - fetching all products');
    
    // Get all products from the backend
    const response = await api.get('/api/products');
    
    console.log('[Affiliate API] Backend response:', {
      status: response.status,
      dataLength: response.data?.length || 0
    });

    // Transform the backend data to match frontend expectations
    const transformedProducts = response.data.map((product: any) => ({
      id: product.id,
      name: product.title,
      description: product.description,
      price: product.price,
      image: product.imageUrl,
      url: product.productUrl,
      fabric: product.fabric ? [product.fabric] : [],
      fit: [],
      care: [],
      construction: []
    }));

    return NextResponse.json(transformedProducts);
  } catch (error: any) {
    console.error('[Affiliate API] Error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Could not connect to the backend server. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to fetch products' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('[Affiliate API] POST request - analyzing product URL:', url);
    
    // Use the backend analyze endpoint
    const response = await api.post('/api/analyze', { url });
    
    console.log('[Affiliate API] Analysis response:', {
      status: response.status,
      data: response.data
    });

    // Transform the analyzed product to match frontend expectations
    const transformedProduct = {
      id: Date.now().toString(), // Generate a temporary ID
      name: response.data.name,
      description: response.data.description || '',
      price: response.data.price || '0',
      image: response.data.image || '',
      url: url,
      fabric: response.data.fabric || [],
      fit: response.data.fit || [],
      care: response.data.care || [],
      construction: response.data.construction || []
    };

    return NextResponse.json(transformedProduct);
  } catch (error: any) {
    console.error('[Affiliate API] Error:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
} 