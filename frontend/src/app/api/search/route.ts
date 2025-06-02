import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Determine the correct backend URL based on the environment
    const isProduction = process.env.NODE_ENV === 'production';
    const backendUrl = isProduction 
      ? 'https://threadtwin.com'  // Use non-www version consistently
      : 'http://localhost:3002';

    console.log(`[API Debug] Making request to: ${backendUrl}/api/dupes/find?query=${encodeURIComponent(query)}`);

    const response = await axios.get(`${backendUrl}/api/dupes/find?query=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': isProduction ? 'https://threadtwin.com' : 'http://localhost:3000'
      },
      maxRedirects: 0, // Prevent redirects
      validateStatus: (status) => status < 400 // Accept any success status
    });

    console.log('[API Debug] Response received:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    // Set CORS headers in the response
    const headers = {
      'Access-Control-Allow-Origin': isProduction ? 'https://www.threadtwin.com' : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    };

    // Check if we have products in the response
    if (!response.data.products || response.data.products.length === 0) {
      console.log('[API Debug] No products found in response');
    }

    return NextResponse.json(response.data, { headers });
  } catch (error: any) {
    console.error('[API Debug] Search error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        headers: error.config?.headers
      }
    });
    
    // Return error with CORS headers
    const headers = {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://www.threadtwin.com' 
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    };

    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to search products' },
      { 
        status: error.response?.status || 500,
        headers
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://www.threadtwin.com' 
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
} 