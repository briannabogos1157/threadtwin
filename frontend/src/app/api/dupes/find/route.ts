import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidateUrls } from '@/lib/backendCandidates';

const FIND_TIMEOUT_MS = Number(process.env.DUPE_SEARCH_PROXY_TIMEOUT_MS) || 30_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bases = getBackendCandidateUrls();
    let lastMessage = '';

    for (const base of bases) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FIND_TIMEOUT_MS);
      try {
        const response = await fetch(`${base}/api/dupes/find`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
      } catch (err) {
        clearTimeout(timer);
        const aborted = err instanceof Error && err.name === 'AbortError';
        if (aborted) {
          return NextResponse.json(
            { error: 'Dupe search is temporarily unavailable' },
            { status: 504 }
          );
        }
        lastMessage = err instanceof Error ? err.message : String(err);
      }
    }

    console.error('[dupes/find] backends unreachable:', lastMessage);
    return NextResponse.json(
      { error: 'Dupe search is temporarily unavailable' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error finding dupes:', error);
    return NextResponse.json(
      { error: 'Dupe search is temporarily unavailable' },
      { status: 500 }
    );
  }
}
