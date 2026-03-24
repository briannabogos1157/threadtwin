import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getBackendCandidateUrls } from '@/lib/backendCandidates';

const TIMEOUT_MS = Number(process.env.ANALYZE_PROXY_TIMEOUT_MS) || 120_000;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const bases = getBackendCandidateUrls();
    let lastMsg = '';

    for (const base of bases) {
      try {
        const response = await axios.post(`${base}/api/analyze`, { url }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: TIMEOUT_MS,
          validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
          return NextResponse.json(response.data);
        }

        const errBody = response.data as { error?: string };
        return NextResponse.json(
          { error: errBody?.error || 'Failed to analyze product' },
          { status: response.status }
        );
      } catch (error: unknown) {
        const ax = error as { code?: string; message?: string };
        lastMsg = ax.code || ax.message || String(error);
        continue;
      }
    }

    return NextResponse.json(
      {
        error: `Could not reach any API (${bases.join(', ')}). Start backend: cd backend && npm run dev. Last: ${lastMsg}`,
      },
      { status: 503 }
    );
  } catch (error: unknown) {
    console.error('[Analyze API] Error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin':
          process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    }
  );
}
