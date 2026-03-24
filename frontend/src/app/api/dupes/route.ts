import { NextRequest, NextResponse } from 'next/server';

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3002';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const url = `${backendBase}/api/dupes${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: typeof data?.error === 'string' ? data.error : 'Failed to load dupes' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dupes list proxy error:', error);
    return NextResponse.json({ error: 'Failed to load dupes' }, { status: 500 });
  }
}
