import { NextRequest, NextResponse } from 'next/server';
import { getBackendCandidateUrls } from '@/lib/backendCandidates';

const STATUS_TIMEOUT_MS = 20_000;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ searchId: string }> }
) {
  const { searchId } = await context.params;
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(searchId)) {
    return NextResponse.json(
      { error: 'Dupe search is temporarily unavailable' },
      { status: 404 }
    );
  }

  const bases = getBackendCandidateUrls();
  let lastMessage = '';
  for (const base of bases) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);
    try {
      const response = await fetch(`${base}/api/dupes/find/${encodeURIComponent(searchId)}`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    } catch (err) {
      clearTimeout(timer);
      lastMessage = err instanceof Error ? err.message : String(err);
    }
  }

  console.error('[dupes/find status] backends unreachable:', lastMessage);
  return NextResponse.json(
    { status: 'searching', searchId },
    { status: 200 }
  );
}
