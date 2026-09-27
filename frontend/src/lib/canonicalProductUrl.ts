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

/** Same identity the backend caches: product path kept, tracking queries removed. */
export function canonicalProductUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return trimmed;

  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  const kept: [string, string][] = [];
  url.searchParams.forEach((value, key) => {
    if (!isTrackingParam(key)) kept.push([key, value]);
  });
  kept.sort(([a], [b]) => a.localeCompare(b));
  url.search = '';
  for (const [key, value] of kept) url.searchParams.append(key, value);
  return url.toString();
}
