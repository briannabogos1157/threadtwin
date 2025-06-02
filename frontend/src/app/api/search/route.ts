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

    const response = await axios.get(`${backendUrl}/api/dupes/find?query=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': isProduction ? 'https://threadtwin.com' : 'http://localhost:3000'
      },
      maxRedirects: 0, // Prevent redirects
      validateStatus: (status) => status < 400 // Accept any success status
    });

    // Set CORS headers in the response
    const headers = {
      'Access-Control-Allow-Origin': isProduction ? 'https://www.threadtwin.com' : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    };

    return NextResponse.json(response.data, { headers });
  } catch (error: any) {
    console.error('Search error:', error);
    
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