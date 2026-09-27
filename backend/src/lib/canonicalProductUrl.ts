const TRACKING_PARAMS = new Set([
  'gclid',
  'gclsrc',
  'gbraid',
  'wbraid',
  'dclid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'igsh',
  'srsltid',
  'yclid',
  'twclid',
  'ttclid',
  '_ga',
  '_gl',
  'campaign',
  'campaignid',
  'campaign_id',
  'adgroup',
  'adgroupid',
  'creative',
  'keyword',
  'matchtype',
  'ref',
  'ref_src',
  'fb_source',
  'vero_id',
  'vero_conv',
]);

function isTrackingParam(key: string): boolean {
  const name = key.toLowerCase();
  if (name.startsWith('utm_')) return true;
  if (name.startsWith('gad_')) return true;
  if (name.startsWith('hsa_')) return true;
  return TRACKING_PARAMS.has(name);
}

/**
 * One identity for a product page. Tracking queries are removed. Path segments
 * and any remaining query, such as a variant or color, stay in place.
 */
export function canonicalProductUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  url.hash = '';
  url.hostname = url.hostname.toLowerCase();

  const kept = [...url.searchParams.entries()]
    .filter(([key]) => !isTrackingParam(key))
    .sort(([a], [b]) => a.localeCompare(b) || 0);

  url.search = '';
  for (const [key, value] of kept) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}
