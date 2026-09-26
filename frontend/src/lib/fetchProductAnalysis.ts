export interface AnalyzedProduct {
  name: string;
  price: number;
  originalPrice?: number | null;
  onSale?: boolean;
  availability?: string;
  description: string;
  imageUrl: string;
  url: string;
  fabric?: string;
  fabricComposition?: string[];
  fit?: string[];
  construction?: string[];
  care?: string[];
  productType?: string;
  retailer?: string;
}

export type ProductAnalysisResult =
  | { ok: true; product: AnalyzedProduct }
  | { ok: false; error: Record<string, unknown> };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const inflight = new Map<string, Promise<ProductAnalysisResult>>();

export function resetProductAnalysisDedupe(): void {
  inflight.clear();
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function productFromPayload(data: Record<string, unknown>, shopUrl: string): AnalyzedProduct {
  const priceRaw = data.price;
  const price =
    typeof priceRaw === 'number'
      ? priceRaw
      : parseFloat(String(priceRaw ?? '0').replace(/[^\d.]/g, '')) || 0;

  const originalRaw = data.originalPrice;
  const originalPrice = typeof originalRaw === 'number' && originalRaw > 0 ? originalRaw : null;

  return {
    name: String(data.name ?? ''),
    price,
    originalPrice,
    onSale: data.onSale === true,
    availability: typeof data.availability === 'string' ? data.availability : '',
    description: String(data.description ?? ''),
    imageUrl: String(data.imageUrl ?? ''),
    url: typeof data.url === 'string' && data.url ? data.url : shopUrl,
    fabric: typeof data.fabric === 'string' ? data.fabric : undefined,
    fabricComposition: stringList(data.fabricComposition),
    fit: stringList(data.fit),
    construction: stringList(data.construction),
    care: stringList(data.care),
    productType: typeof data.productType === 'string' ? data.productType : undefined,
    retailer: typeof data.retailer === 'string' ? data.retailer : undefined,
  };
}

async function requestProductAnalysis(shopUrl: string, fetchImpl: FetchLike): Promise<ProductAnalysisResult> {
  const response = await fetchImpl(`/api/products/details?url=${encodeURIComponent(shopUrl)}`, {
    cache: 'no-store',
  });
  const data = asRecord(await response.json().catch(() => ({})));

  if (!response.ok || data.error) {
    return { ok: false, error: data };
  }

  return { ok: true, product: productFromPayload(data, shopUrl) };
}

/**
 * One product URL shares one in-flight details request.
 * React Strict Mode mounts, cleans up, and mounts again; the second call
 * reuses the first request instead of starting another analysis.
 * After that request settles, a later open or refresh analyzes again.
 */
export function fetchProductAnalysis(
  shopUrl: string,
  fetchImpl: FetchLike = fetch
): Promise<ProductAnalysisResult> {
  const existing = inflight.get(shopUrl);
  if (existing) return existing;

  const promise = requestProductAnalysis(shopUrl, fetchImpl).finally(() => {
    if (inflight.get(shopUrl) === promise) {
      inflight.delete(shopUrl);
    }
  });
  inflight.set(shopUrl, promise);
  return promise;
}
