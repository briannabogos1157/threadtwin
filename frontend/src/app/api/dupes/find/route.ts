import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { luxuryItem } = await request.json();

    if (!luxuryItem) {
      return NextResponse.json(
        { error: 'Luxury item is required' },
        { status: 400 }
      );
    }

    // Call our backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/dupes/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ luxuryItem }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof data?.error === 'string' ? data.error : 'Failed to fetch dupes from backend';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error finding dupes:', error);
    return NextResponse.json(
      { error: 'Failed to find dupes' },
      { status: 500 }
    );
  }
} 