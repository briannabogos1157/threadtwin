import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidateUrls } from '@/lib/backendCandidates';

/** Puppeteer analyze can exceed 30s. */
const ANALYZE_TIMEOUT_MS = Number(process.env.PRODUCT_ANALYZE_PROXY_TIMEOUT_MS) || 120_000;

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

function mapAnalyzeToProduct(
  data: Record<string, unknown>,
  canonicalUrl: string
): Record<string, unknown> {
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

  return {
    name: String(data.name ?? ''),
    price,
    description: buildDescription(data),
    imageUrl: firstImage,
    url: canonicalUrl,
    fabric,
  };
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url?.trim()) {
    return NextResponse.json({ error: 'url query parameter is required' }, { status: 400 });
  }

  const canonicalUrl = url.trim();
  const bases = getBackendCandidateUrls();

  if (bases.length === 0) {
    return NextResponse.json(
      { error: 'No backend URL configured. Set NEXT_PUBLIC_BACKEND_URL or BACKEND_URL.' },
      { status: 500 }
    );
  }

  const tried: string[] = [];
  let lastNetworkMessage = '';

  for (const base of bases) {
    tried.push(base);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

    try {
      const response = await fetch(`${base}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canonicalUrl }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (response.ok) {
        return NextResponse.json(mapAnalyzeToProduct(data, canonicalUrl));
      }

      const message =
        typeof data.error === 'string' ? data.error : 'Failed to analyze product URL';
      return NextResponse.json({ error: message }, { status: response.status });
    } catch (err) {
      clearTimeout(timer);
      const aborted = err instanceof Error && err.name === 'AbortError';
      if (aborted) {
        return NextResponse.json(
          {
            error:
              'Analyzing this page took too long. Try again or open the product link directly.',
          },
          { status: 504 }
        );
      }
      lastNetworkMessage = err instanceof Error ? err.message : String(err);
      continue;
    }
  }

  console.error('[products/details] all backends failed:', tried, lastNetworkMessage);

  return NextResponse.json(
    {
      error: `API unreachable (${tried.join(' → ')}). Start the backend: cd backend && npm run dev (port 3002). Last error: ${lastNetworkMessage || 'connection failed'}`,
    },
    { status: 503 }
  );
}
