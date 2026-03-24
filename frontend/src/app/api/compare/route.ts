import { NextRequest, NextResponse } from 'next/server';

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3002';

/** Scraper shape uses `images[]`; product page expects `imageUrl`. */
function withImageUrl<T extends Record<string, unknown>>(product: T): T & { imageUrl: string } {
  const images = product.images;
  const first =
    Array.isArray(images) && typeof images[0] === 'string' ? images[0] : '';
  const { images: _i, ...rest } = product;
  return { ...rest, imageUrl: first } as T & { imageUrl: string };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${backendBase}/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: typeof data?.error === 'string' ? data.error : 'Compare failed' },
        { status: response.status }
      );
    }

    if (data.original && data.dupe) {
      return NextResponse.json({
        ...data,
        original: withImageUrl(data.original as Record<string, unknown>),
        dupe: withImageUrl(data.dupe as Record<string, unknown>),
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[compare] proxy error:', err);
    return NextResponse.json(
      { error: 'Could not reach the compare service. Is the backend running?' },
      { status: 503 }
    );
  }
}
