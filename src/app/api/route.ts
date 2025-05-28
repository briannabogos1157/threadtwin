import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  
  // Only respond if the path is exactly /api
  if (url.pathname === '/api') {
    return NextResponse.json({
      status: 'API is running',
      endpoints: {
        health: '/api/health',
        analyze: '/api/analyze',
        compare: '/api/compare',
      },
    });
  }

  // For any other path, redirect to the frontend
  return NextResponse.redirect(new URL('/', request.url));
} 