import { canonicalProductUrl } from '../lib/canonicalProductUrl';
import { sameExactProduct } from '../lib/exactProduct';
import {
  createManusStructuredTask,
  readManusDupeTask,
  type DupeManusRead,
} from './manus.service';

export interface BlockedProductDetails {
  name: string;
  price: number;
  originalPrice: number | null;
  onSale: boolean;
  availability: string;
  description: string;
  fabricComposition: string[];
  materialSummary?: string;
  construction: string[];
  fit: string[];
  careInstructions: string[];
  images: string[];
  url: string;
  retailer?: string;
  source: 'manus-fallback';
}

const BLOCKED_PRODUCT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verified', 'product'],
  properties: {
    verified: { type: 'boolean' },
    product: {
      type: 'object',
      additionalProperties: false,
      required: [
        'name',
        'retailer',
        'url',
        'imageUrl',
        'currentPrice',
        'originalPrice',
        'currency',
        'fabric',
        'fit',
        'construction',
        'description',
        'availability',
      ],
      properties: {
        name: { type: 'string' },
        retailer: { type: 'string' },
        url: { type: 'string' },
        imageUrl: { type: ['string', 'null'] },
        currentPrice: { type: ['number', 'null'] },
        originalPrice: { type: ['number', 'null'] },
        currency: { type: ['string', 'null'] },
        fabric: { type: ['string', 'null'] },
        fit: { type: ['string', 'null'] },
        construction: { type: 'array', items: { type: 'string' } },
        description: { type: ['string', 'null'] },
        availability: {
          type: 'string',
          enum: ['in_stock', 'out_of_stock', 'unknown'],
        },
      },
    },
  },
};

const UNUSABLE_NAME = /^(product|access denied|page not found|just a moment|attention required|robot check)$/i;
const PLACEHOLDER_IMAGE = /placehold\.co|via\.placeholder|example\.com|placeholder/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveAmount(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function detailList(value: unknown): string[] {
  if (typeof value === 'string') {
    const text = value.trim();
    return text ? [text] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function verifiedImage(value: unknown): string {
  const image = cleanText(value);
  if (!/^https:\/\//i.test(image)) return '';
  if (PLACEHOLDER_IMAGE.test(image)) return '';
  return image;
}

function verifiedFabric(value: unknown): string {
  const fabric = cleanText(value);
  if (!fabric) return '';
  if (/^(unknown|n\/a|none|material|not available)$/i.test(fabric)) return '';
  return fabric;
}

function availabilityLabel(value: unknown): string {
  if (value === 'in_stock') return 'In stock';
  if (value === 'out_of_stock') return 'Out of stock';
  return '';
}

/**
 * Accept a structured Manus answer only when it names the requested product.
 * Missing price, image, fabric, and description stay empty.
 */
export function interpretBlockedProduct(
  requestedUrl: string,
  value: unknown
): BlockedProductDetails | null {
  const record = asRecord(value);
  if (!record) return null;
  if (record.verified === false) return null;

  const product = asRecord(record.product) ?? record;
  const name = cleanText(product.name);
  const returnedUrl = cleanText(product.url);
  const canonicalUrl = canonicalProductUrl(requestedUrl);
  if (!name || UNUSABLE_NAME.test(name) || !returnedUrl || !canonicalUrl) return null;
  if (!sameExactProduct(canonicalUrl, returnedUrl)) return null;

  const price = positiveAmount(product.currentPrice ?? product.price);
  const originalPrice = positiveAmount(product.originalPrice);
  const onSale = price != null && originalPrice != null && originalPrice > price;
  const fabric = verifiedFabric(product.fabric ?? product.materialSummary);
  const image = verifiedImage(product.imageUrl ?? product.image);
  const retailer = cleanText(product.retailer);

  return {
    name,
    price: price ?? 0,
    originalPrice: onSale ? originalPrice : null,
    onSale,
    availability: availabilityLabel(product.availability),
    description: cleanText(product.description),
    fabricComposition: [],
    materialSummary: fabric || undefined,
    construction: detailList(product.construction),
    fit: detailList(product.fit),
    careInstructions: [],
    images: image ? [image] : [],
    url: canonicalUrl,
    retailer: retailer || undefined,
    source: 'manus-fallback',
  };
}

function enrichmentPrompt(productUrl: string): string {
  return `Retrieve publicly listed details for this exact product page. Do not try to defeat a bot check, and do not substitute a similar, newer, or related item.

Exact product URL: ${productUrl}

Confirm the product identifier in that URL. If you cannot verify that exact product, set verified to false and leave the product fields empty.

Use null, an empty string, or an empty list for any fact you cannot verify. Do not guess a name, price, image, material, fit, construction, description, or availability.`;
}

export async function enrichBlockedProductWithManus(
  productUrl: string,
  deps: {
    create?: (prompt: string, schema: unknown) => Promise<string>;
    read?: (taskId: string) => Promise<DupeManusRead>;
    sleep?: (ms: number) => Promise<void>;
    maxWaitMs?: number;
    pollIntervalMs?: number;
  } = {}
): Promise<BlockedProductDetails | null> {
  const create = deps.create ?? createManusStructuredTask;
  const read = deps.read ?? readManusDupeTask;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const maxWaitMs = deps.maxWaitMs ?? (Number(process.env.BLOCKED_ENRICH_MAX_WAIT_MS) || 200_000);
  const pollIntervalMs = deps.pollIntervalMs ?? (Number(process.env.MANUS_POLL_INTERVAL_MS) || 4_000);

  const taskId = await create(enrichmentPrompt(productUrl), BLOCKED_PRODUCT_SCHEMA);
  const started = Date.now();

  while (Date.now() - started < maxWaitMs) {
    await sleep(pollIntervalMs);
    const task = await read(taskId);
    if (task.phase === 'searching') continue;
    if (task.phase === 'failed') return null;
    const value = task.structured?.success ? task.structured.value : null;
    return interpretBlockedProduct(productUrl, value);
  }

  return null;
}
