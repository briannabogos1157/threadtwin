import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidateUrls } from '@/lib/backendCandidates';

const SEARCH_TIMEOUT_MS = Number(process.env.PRODUCT_SEARCH_PROXY_TIMEOUT_MS) || 420_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || searchParams.get('q');

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
  }

  const q = encodeURIComponent(query.trim());
  const bases = getBackendCandidateUrls();
  let lastMsg = '';

  for (const base of bases) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    try {
      const response = await fetch(`${base}/api/products/search?query=${q}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(t);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return NextResponse.json(
          {
            error: typeof data?.error === 'string' ? data.error : 'Search failed',
            products: [],
          },
          { status: response.status }
        );
      }

      return NextResponse.json(data);
    } catch (err) {
      clearTimeout(t);
      const aborted = err instanceof Error && err.name === 'AbortError';
      if (aborted) {
        return NextResponse.json(
          {
            error:
              'Search timed out. Manus can take several minutes — try a simpler query or try again.',
            products: [],
          },
          { status: 504 }
        );
      }
      lastMsg = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json(
    {
      error: `Could not reach any API. Start backend: cd backend && npm run dev. (${lastMsg})`,
      products: [],
    },
    { status: 503 }
  );
}
