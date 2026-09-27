import { canonicalProductUrl } from './canonicalProductUrl';
import { productUrlRejection } from '../services/dupeSearch';

function hostKey(url: URL): string {
  return url.hostname.replace(/^www\./i, '').toLowerCase();
}

function isProductCode(value: string): boolean {
  if (value.length < 6 || value.length > 80) return false;
  if (!/[a-z]/i.test(value) || !/\d/.test(value)) return false;
  return /^[a-z0-9][a-z0-9_-]*$/i.test(value);
}

/** Product codes in the path or a non-tracking query. Descriptive slugs are not codes. */
export function productIdentityTokens(productUrl: string): string[] {
  const canonical = canonicalProductUrl(productUrl);
  if (!canonical) return [];
  const url = new URL(canonical);
  const parts = [...url.pathname.split('/'), ...url.searchParams.values()];
  const tokens = new Set<string>();
  for (const part of parts) {
    let decoded = part;
    try {
      decoded = decodeURIComponent(part);
    } catch {
      decoded = part;
    }
    if (isProductCode(decoded)) tokens.add(decoded.toLowerCase());
  }
  return [...tokens];
}

/**
 * The returned page is the requested product when it is the same host, not a
 * search or category page, and it still carries every product code from the
 * request. A page with no product code must keep the same path.
 */
export function sameExactProduct(requested: string, returned: string): boolean {
  const requestedCanonical = canonicalProductUrl(requested);
  const returnedCanonical = canonicalProductUrl(returned);
  if (!requestedCanonical || !returnedCanonical) return false;
  if (productUrlRejection(returnedCanonical)) return false;

  const requestedUrl = new URL(requestedCanonical);
  const returnedUrl = new URL(returnedCanonical);
  if (hostKey(requestedUrl) !== hostKey(returnedUrl)) return false;

  const tokens = productIdentityTokens(requestedCanonical);
  if (tokens.length > 0) {
    const haystack = `${returnedUrl.pathname}${returnedUrl.search}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  }

  const requestedPath = requestedUrl.pathname.replace(/\/+$/, '') || '/';
  const returnedPath = returnedUrl.pathname.replace(/\/+$/, '') || '/';
  return requestedPath === returnedPath;
}
