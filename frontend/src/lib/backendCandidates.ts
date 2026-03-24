/**
 * URLs to try when proxying to the ThreadTwin API from Next.js route handlers.
 * Order: explicit env → common local ports → production fallback.
 */
export function getBackendCandidateUrls(): string[] {
  const raw = [
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://127.0.0.1:3002',
    'http://localhost:3002',
    'https://api.threadtwin.com',
  ];

  const out: string[] = [];
  const seen = new Set<string>();

  for (const r of raw) {
    if (!r?.trim()) continue;
    const u = r.trim().replace(/\/$/, '');
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }

  return out;
}
