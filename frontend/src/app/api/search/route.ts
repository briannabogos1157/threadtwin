import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3002';
    const response = await axios.get(`${backendUrl}/api/dupes/find?query=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to search products' },
      { status: error.response?.status || 500 }
    );
  }
} 