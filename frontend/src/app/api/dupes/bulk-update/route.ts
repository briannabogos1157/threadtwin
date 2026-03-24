import { NextRequest, NextResponse } from 'next/server';

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3002';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${backendBase}/api/dupes/bulk-update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: typeof data?.error === 'string' ? data.error : 'Bulk update failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dupes bulk-update proxy error:', error);
    return NextResponse.json({ error: 'Bulk update failed' }, { status: 500 });
  }
}
