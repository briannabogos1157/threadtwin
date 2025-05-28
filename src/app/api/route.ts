import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  // Always redirect to the frontend for the root path
  const url = new URL(request.url);
  if (url.pathname === '/api') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // For other API routes, return the API status
  return NextResponse.json({
    status: 'API is running',
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze',
      compare: '/api/compare',
    },
  });
} 