import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      console.log('[API Debug] No query parameter provided');
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Determine the correct backend URL based on the environment
    const isProduction = process.env.NODE_ENV === 'production';
    const backendUrl = isProduction 
      ? 'https://threadtwin-backend-f12a4jgla-briannas-projects-510aeadc.vercel.app'  // Use Vercel deployment URL
      : 'http://localhost:3002';

    const requestUrl = `${backendUrl}/api/products/search?query=${encodeURIComponent(query)}`;
    console.log('[API Debug] Request details:', {
      url: requestUrl,
      query: query,
      isProduction: isProduction,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': isProduction ? 'https://www.threadtwin.com' : 'http://localhost:3000'
      }
    });

    const response = await axios.get(requestUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': isProduction ? 'https://www.threadtwin.com' : 'http://localhost:3000'
      },
      maxRedirects: 5, // Allow some redirects just in case
      validateStatus: (status) => status < 400 // Accept any success status
    });

    console.log('[API Debug] Backend response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: JSON.stringify(response.data, null, 2)
    });

    // Transform the response to match the frontend's expected format
    const products = response.data.products || [];
    
    if (!products || products.length === 0) {
      console.log('[API Debug] No products found in response. Raw response:', response.data);
    } else {
      console.log(`[API Debug] Found ${products.length} products`);
    }

    // Set CORS headers in the response
    const headers = {
      'Access-Control-Allow-Origin': isProduction ? 'https://www.threadtwin.com' : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    };

    // Return the products array directly
    return NextResponse.json({ products }, { headers });
  } catch (error: any) {
    console.error('[API Debug] Search error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        baseURL: error.config?.baseURL
      },
      stack: error.stack
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
      { error: error.response?.data?.error || 'Failed to search products', products: [] },
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