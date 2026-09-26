export type MatchStatus = 'matched' | 'partial' | 'mismatch' | 'unavailable';
export type MatchConfidence = 'high' | 'medium' | 'low';

export function formatMatchCategory(
  label: string,
  score: number | null | undefined,
  status?: MatchStatus,
  note?: string
): string {
  if (status === 'unavailable' || score == null) return `${label}: not enough data`;
  const word = status === 'partial'
    ? 'partial match'
    : status === 'mismatch'
      ? 'mismatch'
      : 'match';
  const detail = note && note !== 'not enough data' ? ` · ${note}` : '';
  return `${label}: ${score}% ${word}${detail}`;
}

export function formatMatchHeadline(total: number, confidence?: MatchConfidence): string {
  if (!confidence) return `${total}% match`;
  return `${total}% match · ${confidence} coverage`;
}

export function formatMatchCoverage(facets?: number, coverage?: number): string | null {
  if (facets == null || coverage == null) return null;
  const noun = facets === 1 ? 'facet' : 'facets';
  return `${facets} comparable ${noun} · ${coverage}% coverage`;
}
