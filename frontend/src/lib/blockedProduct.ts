export interface SavedProductDetails {
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

function numberFrom(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

function analysisText(error: Record<string, unknown>): string {
  return [error.error, error.details, error.hint]
    .filter((part): part is string => typeof part === 'string')
    .join(' ');
}

export function isBlockedAnalysis(error: Record<string, unknown>): boolean {
  return /HTTP 4\d\d|product page blocked the request|access denied|unusual activity|verify you are human|robot check|captcha/i.test(
    analysisText(error)
  );
}

export function blockStatusLine(error: Record<string, unknown>): string {
  const text = analysisText(error);
  const http = text.match(/HTTP (\d{3})/i);
  if (http) return `The retailer returned HTTP ${http[1]}.`;
  if (/unusual activity|captcha|verify you are human|robot check|blocked the request|access denied/i.test(text)) {
    return 'The retailer showed a bot-check page.';
  }
  return 'The product page could not be read.';
}

/**
 * Saved search or cart details are real when they include a name, photo, or price.
 * A URL-only record, or the placeholder name "Product", is not a saved product.
 */
export function savedProductFromRecord(
  stored: Record<string, unknown>,
  url: string
): SavedProductDetails | null {
  const rawName = String(stored.name ?? stored.title ?? '').trim();
  const name = /^product$/i.test(rawName) ? '' : rawName;
  const price = numberFrom(stored.price);
  const imageUrl = String(stored.imageUrl ?? stored.image ?? '').trim();
  const description = String(stored.description ?? '').trim();
  if (!name && price <= 0 && !imageUrl && !description) return null;

  const originalPrice = numberFrom(stored.originalPrice);
  const fabric = String(stored.fabric ?? stored.materialSummary ?? '').trim();

  return {
    name: name || 'Saved product',
    price,
    originalPrice: originalPrice > price ? originalPrice : null,
    onSale: stored.onSale === true && originalPrice > price,
    availability: typeof stored.availability === 'string' ? stored.availability : '',
    description,
    imageUrl,
    url,
    fabric: fabric || undefined,
    fabricComposition: stringList(stored.fabricComposition),
    fit: stringList(stored.fit),
    construction: stringList(stored.construction),
    care: stringList(stored.care),
    productType: typeof stored.productType === 'string' ? stored.productType : undefined,
    retailer: typeof stored.retailer === 'string' ? stored.retailer : undefined,
  };
}
