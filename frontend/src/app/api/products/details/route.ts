import { NextRequest, NextResponse } from 'next/server';

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3002';

function buildDescription(data: Record<string, unknown>): string {
  const parts: string[] = [];
  const fabric = data.fabricComposition;
  const construction = data.construction;
  const fit = data.fit;
  const care = data.careInstructions;

  if (Array.isArray(fabric) && fabric.length) {
    parts.push(`Fabric: ${fabric.join(', ')}.`);
  }
  if (Array.isArray(construction) && construction.length) {
    parts.push(`Construction: ${construction.join(', ')}.`);
  }
  if (Array.isArray(fit) && fit.length) {
    parts.push(`Fit: ${fit.join(', ')}.`);
  }
  if (Array.isArray(care) && care.length) {
    parts.push(`Care: ${care.join(', ')}.`);
  }
  return parts.join(' ').trim();
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url?.trim()) {
    return NextResponse.json({ error: 'url query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendBase}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const message =
        typeof data.error === 'string' ? data.error : 'Failed to analyze product URL';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const images = data.images;
    const firstImage =
      Array.isArray(images) && typeof images[0] === 'string' ? images[0] : '';

    const priceRaw = data.price;
    const price =
      typeof priceRaw === 'number'
        ? priceRaw
        : parseFloat(String(priceRaw ?? '0')) || 0;

    const fabricComposition = data.fabricComposition;
    const fabric =
      Array.isArray(fabricComposition) && fabricComposition.length
        ? fabricComposition.filter((x): x is string => typeof x === 'string').join(', ')
        : undefined;

    return NextResponse.json({
      name: String(data.name ?? ''),
      price,
      description: buildDescription(data),
      imageUrl: firstImage,
      url: url.trim(),
      fabric,
    });
  } catch (err) {
    console.error('[products/details] proxy error:', err);
    return NextResponse.json(
      { error: 'Could not reach the product analysis service. Is the backend running?' },
      { status: 503 }
    );
  }
}
