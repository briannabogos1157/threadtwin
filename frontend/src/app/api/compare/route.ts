import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidateUrls } from '@/lib/backendCandidates';

const COMPARE_PROXY_MS = Number(process.env.COMPARE_PROXY_TIMEOUT_MS) || 130_000;

/** Scraper shape uses `images[]`; product page expects `imageUrl`. */
function withImageUrl(product: Record<string, unknown>): Record<string, unknown> {
  const images = product.images;
  const first =
    Array.isArray(images) && typeof images[0] === 'string' ? images[0] : '';
  const { images: _i, ...rest } = product;
  return { ...rest, imageUrl: first };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bases = getBackendCandidateUrls();
    let lastMsg = '';

    for (const base of bases) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), COMPARE_PROXY_MS);

      try {
        const response = await fetch(`${base}/api/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(t);

        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

        if (!response.ok) {
          return NextResponse.json(
            {
              error: typeof data.error === 'string' ? data.error : 'Compare failed',
              details: typeof data.details === 'string' ? data.details : undefined,
            },
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
        clearTimeout(t);
        const aborted = err instanceof Error && err.name === 'AbortError';
        if (aborted) {
          return NextResponse.json(
            { error: 'Compare timed out waiting for the API. Try again with two simple public product URLs.' },
            { status: 504 }
          );
        }
        lastMsg = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json(
      {
        error: 'Could not reach any API server.',
        details: lastMsg || undefined,
      },
      { status: 503 }
    );
  } catch (err) {
    console.error('[compare] proxy error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
