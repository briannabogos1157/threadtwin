const STORAGE_KEY = 'threadtwinDupeSearch';
export const DUPE_POLL_INTERVAL_MS = 5_000;
export const STILL_SEARCHING_AFTER_MS = 12_000;

export interface SavedDupeSearch {
  url: string;
  searchId: string;
}

export function rememberDupeSearch(url: string, searchId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, searchId }));
}

export function loadDupeSearch(url: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedDupeSearch;
    if (!saved || saved.url !== url || !saved.searchId) return null;
    return saved.searchId;
  } catch {
    return null;
  }
}

export function clearDupeSearch(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function dupeSearchMessage(input: {
  status: 'searching' | 'complete' | 'unavailable';
  outcome?: 'results' | 'none' | 'unusable';
  createdAt: number;
  now: number;
  resultCount: number;
}): string {
  if (input.status === 'unavailable') return 'Dupe search is temporarily unavailable';
  if (input.status === 'complete') {
    if (input.outcome === 'unusable') return 'Dupe search could not return results';
    if (input.resultCount > 0 || input.outcome === 'results') return 'Results found';
    if (input.outcome === 'none') return 'No similar products found';
    return 'Dupe search could not return results';
  }
  return input.now - input.createdAt >= STILL_SEARCHING_AFTER_MS
    ? 'Still searching…'
    : 'Searching for your twins…';
}

export function dupeSearchIsFinished(status: string): boolean {
  return status === 'complete' || status === 'unavailable';
}
