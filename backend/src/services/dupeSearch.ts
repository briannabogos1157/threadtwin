import { dedupeInFlight } from '../lib/dedupeInFlight';
import similarityScorer, { type MatchBreakdown } from './similarity';
import { createManusDupeTask, readManusDupeTask, type DupeManusRead } from './manus.service';

export interface DupeSearchProduct {
  name: string;
  productType?: string;
  fabric?: string;
  fabricComposition?: string[];
  fit?: string[];
  construction?: string[];
  care?: string[];
  price?: number;
  originalPrice?: number | null;
  onSale?: boolean;
  description?: string;
  retailer?: string;
  url?: string;
}

export interface DupeSearchResult {
  name: string;
  retailer: string;
  url: string;
  imageUrl: string;
  price: number;
  originalPrice: number | null;
  onSale: boolean;
  fabric: string;
  match: MatchBreakdown;
}

const PRODUCT_TYPES: Array<[RegExp, string]> = [
  [/\bt-?shirts?\b|\btees?\b/i, 't-shirt'],
  [/\bhoodies?\b/i, 'hoodie'],
  [/\bsweatshirts?\b/i, 'sweatshirt'],
  [/\bsweaters?\b|\bjumpers?\b/i, 'sweater'],
  [/\bdresses?\b/i, 'dress'],
  [/\bjeans\b/i, 'jeans'],
  [/\btrousers?\b|\bpants\b/i, 'trousers'],
  [/\bskirts?\b/i, 'skirt'],
  [/\bjackets?\b/i, 'jacket'],
  [/\bcoats?\b/i, 'coat'],
  [/\bblouses?\b/i, 'blouse'],
  [/\bshorts\b/i, 'shorts'],
  [/\bsneakers?\b|\bshoes?\b/i, 'shoes'],
];

export function retailerFromUrl(pageUrl: string): string {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function inferProductType(name: string, description = ''): string {
  const text = `${name} ${description}`;
  for (const [pattern, label] of PRODUCT_TYPES) {
    if (pattern.test(text)) return label;
  }
  return '';
}

export function parseMoney(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(value ?? '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function asStringList(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value.trim().toLowerCase()];
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
}

function isDisplayableImageUrl(link: string): boolean {
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (!url.hostname.includes('.')) return false;
    if (/mock-product|example\.com|placeholder|localhost/i.test(`${url.hostname}${url.pathname}`)) return false;
    return true;
  } catch {
    return false;
  }
}

export function productUrlRejection(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return 'invalid URL';
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'unsupported protocol';
  if (!url.hostname.includes('.')) return 'not a retailer host';
  const hostPath = `${url.hostname}${url.pathname}${url.search}`;
  if (/mock-product|example\.com|placeholder|localhost/i.test(hostPath)) return 'mock or placeholder link';
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || /^\/(index|home)(\.html)?$/i.test(path)) return 'homepage';
  if (/\/search(-results)?(\/|$)/i.test(path) || /[?&](q|query|search)=/i.test(url.search)) {
    return 'search results page';
  }
  const productPage = /\/(products?|p|dp|ip|pd|item|items)\//i.test(path)
    || /-p\d+\.html$/i.test(path)
    || /\/productpage\./i.test(path);
  if (/-l\d+\.html$/i.test(path)) return 'category page';
  if (/\/(category|categories|catalog|browse)(\/|$)/i.test(path) && !productPage) return 'category page';
  if (/\/collections\/[^/]+$/i.test(path) && !productPage) return 'category page';
  if (!productPage && path.split('/').filter(Boolean).length < 2) return 'not a direct product page';
  return null;
}

export function normalizeSearchProduct(body: unknown): DupeSearchProduct | null {
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const source = record.product && typeof record.product === 'object'
    ? record.product as Record<string, unknown>
    : record;
  const name = String(source.name ?? source.luxuryItem ?? source.originalProduct ?? '').trim();
  if (!name) return null;

  const url = String(source.url ?? '').trim();
  const description = String(source.description ?? '').trim();
  const price = parseMoney(source.price);
  const originalPrice = parseMoney(source.originalPrice);
  const fabric = String(source.fabric ?? source.materialSummary ?? '').trim();

  return {
    name,
    productType: String(source.productType ?? '').trim() || inferProductType(name, description),
    fabric,
    fabricComposition: asStringList(source.fabricComposition),
    fit: asStringList(source.fit),
    construction: asStringList(source.construction),
    care: asStringList(source.care ?? source.careInstructions),
    price,
    originalPrice: originalPrice > price ? originalPrice : null,
    onSale: source.onSale === true && originalPrice > price,
    description,
    retailer: String(source.retailer ?? '').trim() || retailerFromUrl(url),
    url,
  };
}

function candidateProfile(item: Record<string, unknown>): DupeSearchProduct {
  return {
    name: String(item.title ?? item.name ?? ''),
    fabric: String(item.fabric ?? item.material ?? ''),
    description: [
      item.fabric,
      item.construction,
      item.fit,
      item.care,
      item.description,
    ].filter((part) => typeof part === 'string').join(' '),
    fit: asStringList(item.fit),
    construction: asStringList(item.construction),
    care: asStringList(item.care),
  };
}

export function scoreCandidates(
  original: DupeSearchProduct,
  candidates: unknown
): DupeSearchResult[] {
  const list = Array.isArray(candidates)
    ? candidates
    : candidates && typeof candidates === 'object' && 'products' in candidates
      ? (candidates as { products: unknown }).products
      : candidates && typeof candidates === 'object' && 'dupes' in candidates
        ? (candidates as { dupes: unknown }).dupes
        : [];
  if (!Array.isArray(list)) return [];

  const sourceUrl = original.url ? safeHref(original.url) : '';
  const seen = new Set<string>();
  const results: DupeSearchResult[] = [];

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const url = String(record.link ?? record.url ?? record.productUrl ?? '').trim();
    if (productUrlRejection(url)) continue;
    const href = safeHref(url);
    if (!href || href === sourceUrl || seen.has(href)) continue;
    seen.add(href);

    const price = parseMoney(record.price ?? record.currentPrice);
    const originalPrice = parseMoney(record.originalPrice ?? record.compareAtPrice);
    const onSale = originalPrice > price && price > 0;
    const candidate = candidateProfile(record);
    const match = similarityScorer.calculateSimilarity(original, {
      ...candidate,
      careInstructions: candidate.care,
    });
    const image = String(record.imageUrl ?? record.image ?? '').trim();

    results.push({
      name: String(record.title ?? record.name ?? '').trim() || 'Product',
      retailer: String(record.retailer ?? record.store ?? '').trim() || retailerFromUrl(href),
      url: href,
      imageUrl: isDisplayableImageUrl(image) ? image : '',
      price,
      originalPrice: onSale ? originalPrice : null,
      onSale,
      fabric: String(record.fabric ?? record.material ?? '').trim(),
      match,
    });
  }

  return results.sort((a, b) => b.match.total - a.match.total);
}

function safeHref(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.href;
  } catch {
    return '';
  }
}

export function dupeSearchPrompt(product: DupeSearchProduct): string {
  const price = product.price && product.price > 0 ? `$${product.price}` : 'unknown';
  const original = product.onSale && product.originalPrice
    ? `$${product.originalPrice} (on sale; current price is ${price})`
    : 'not on sale';

  return `Search for several real alternatives to this analyzed clothing product.
Use product type, fabric, fit, construction, description, and overall design to judge similarity.
Prefer products that are currently purchasable and in stock.
Price may be displayed or used to skip an item. A lower price must not make a product more similar.
Every url must be a direct product page you actually found. Reject homepages, search-result pages, category pages, and guessed URLs.
Do not invent fabric, fit, price, or availability. Use null or an empty list when the page does not state that fact.
Do not return this source product URL.
If you cannot find valid products, return {"products":[]}.

Return ONLY this JSON object, with no explanation before or after it:
{"products":[{"name":"Product name","retailer":"Retailer name","url":"https://real-direct-product-url","imageUrl":"https://... or null","currentPrice":29.99,"originalPrice":39.99,"currency":"USD","fabric":"100% Cotton","fit":"Regular","construction":["crew neck","wide sleeves"],"care":[],"availability":"in_stock"}]}

Name: ${product.name}
Product type: ${product.productType || 'unknown'}
Retailer: ${product.retailer || 'unknown'}
Source URL: ${product.url || 'unknown'}
Fabric: ${product.fabric || product.fabricComposition?.join(', ') || 'unknown'}
Fit: ${product.fit?.join(', ') || 'unknown'}
Construction: ${product.construction?.join(', ') || 'unknown'}
Care: ${product.care?.join(', ') || 'unknown'}
Current price: ${price}
Original price: ${original}
Description: ${(product.description || '').slice(0, 500)}`;
}

export function isDupeSearchUnavailable(message: string): boolean {
  return /not configured|401|api key has been deleted|temporarily unavailable/i.test(message);
}

export type DupeSearchOutcome = 'results' | 'none' | 'unusable';

export interface RejectedDupe {
  name: string;
  url: string;
  reason: string;
}

export interface InterpretedDupeAnswer {
  outcome: DupeSearchOutcome;
  reason?: string;
  results: DupeSearchResult[];
  rejected: RejectedDupe[];
  returnedCount: number;
}

const COULD_NOT_RETURN = 'Dupe search could not return results';

export function interpretDupeAnswer(
  original: DupeSearchProduct,
  input: { assistantText?: string; structured?: { success: boolean; value: unknown; error?: string | null } | null }
): InterpretedDupeAnswer {
  if (input.structured) {
    if (!input.structured.success) {
      return {
        outcome: 'unusable',
        reason: input.structured.error || 'structured output extraction failed',
        results: [],
        rejected: [],
        returnedCount: 0,
      };
    }
    return reviewProductList(original, input.structured.value);
  }

  const text = (input.assistantText || '').trim();
  if (!text) {
    return {
      outcome: 'unusable',
      reason: 'completed with no assistant response',
      results: [],
      rejected: [],
      returnedCount: 0,
    };
  }
  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== 'object') {
    return {
      outcome: 'unusable',
      reason: 'assistant response was not valid JSON',
      results: [],
      rejected: [],
      returnedCount: 0,
    };
  }
  return reviewProductList(original, parsed);
}

function reviewProductList(original: DupeSearchProduct, payload: unknown): InterpretedDupeAnswer {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
  const list = Array.isArray(payload)
    ? payload
    : record && Array.isArray(record.products)
      ? record.products
      : record && Array.isArray(record.dupes)
        ? record.dupes
        : null;
  if (!list) {
    return {
      outcome: 'unusable',
      reason: 'response did not contain a products array',
      results: [],
      rejected: [],
      returnedCount: 0,
    };
  }
  if (list.length === 0) {
    return { outcome: 'none', results: [], rejected: [], returnedCount: 0 };
  }

  const sourceUrl = original.url ? safeHref(original.url) : '';
  const rejected: RejectedDupe[] = [];
  const accepted: unknown[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') {
      rejected.push({ name: '', url: '', reason: 'malformed product' });
      continue;
    }
    const product = item as Record<string, unknown>;
    const name = String(product.name ?? product.title ?? '').trim();
    const url = String(product.url ?? product.link ?? '').trim();
    const reason = !name ? 'missing name' : productUrlRejection(url);
    const href = reason ? '' : safeHref(url);
    if (!name || reason || !href) {
      rejected.push({ name, url, reason: reason || 'invalid URL' });
      continue;
    }
    if (href === sourceUrl) {
      rejected.push({ name, url: href, reason: 'source product' });
      continue;
    }
    accepted.push(product);
  }

  const results = scoreCandidates(original, accepted);
  if (results.length === 0) {
    return {
      outcome: 'unusable',
      reason: 'no returned product passed validation',
      results: [],
      rejected,
      returnedCount: list.length,
    };
  }
  return { outcome: 'results', results, rejected, returnedCount: list.length };
}

export interface DupeSearchJobView {
  searchId: string;
  status: 'searching' | 'complete' | 'unavailable';
  outcome?: DupeSearchOutcome;
  createdAt: number;
  results?: DupeSearchResult[];
  error?: string;
}

interface StoredDupeSearch {
  id: string;
  product: DupeSearchProduct;
  productKey: string;
  status: 'searching' | 'complete' | 'unavailable';
  outcome?: DupeSearchOutcome;
  createdAt: number;
  results?: DupeSearchResult[];
  error?: string;
  read?: Promise<DupeSearchJobView>;
}

const jobs = new Map<string, StoredDupeSearch>();
const runningByProduct = new Map<string, string>();
const creating = new Map<string, Promise<DupeSearchJobView>>();

export function productSearchKey(product: DupeSearchProduct): string {
  const url = (product.url || '').trim().toLowerCase().replace(/\/$/, '');
  return url || product.name.trim().toLowerCase();
}

export function resetDupeSearches(): void {
  jobs.clear();
  runningByProduct.clear();
  creating.clear();
}

function viewOf(job: StoredDupeSearch): DupeSearchJobView {
  const showError = job.status === 'unavailable' || job.outcome === 'unusable';
  return {
    searchId: job.id,
    status: job.status,
    outcome: job.outcome,
    createdAt: job.createdAt,
    results: job.status === 'complete' && job.outcome !== 'unusable' ? job.results || [] : undefined,
    error: showError ? job.error || 'Dupe search is temporarily unavailable' : undefined,
  };
}

export async function startDupeSearch(
  product: DupeSearchProduct,
  create: (prompt: string) => Promise<string> = createManusDupeTask
): Promise<DupeSearchJobView> {
  const productKey = productSearchKey(product);
  const existingId = runningByProduct.get(productKey);
  const existing = existingId ? jobs.get(existingId) : undefined;
  if (existing?.status === 'searching') return viewOf(existing);

  return dedupeInFlight(creating, productKey, async () => {
    const againId = runningByProduct.get(productKey);
    const again = againId ? jobs.get(againId) : undefined;
    if (again?.status === 'searching') return viewOf(again);

    const taskId = await create(dupeSearchPrompt(product));
    const job: StoredDupeSearch = {
      id: taskId,
      product,
      productKey,
      status: 'searching',
      createdAt: Date.now(),
    };
    jobs.set(taskId, job);
    runningByProduct.set(productKey, taskId);
    return viewOf(job);
  });
}

export async function readDupeSearch(
  searchId: string,
  readTask: (taskId: string) => Promise<DupeManusRead> = readManusDupeTask
): Promise<DupeSearchJobView | null> {
  const job = jobs.get(searchId);
  if (!job) return null;
  if (job.status !== 'searching') return viewOf(job);
  if (job.read) return job.read;

  job.read = readSearchingJob(job, readTask).finally(() => {
    job.read = undefined;
  });
  return job.read;
}

function finishJob(job: StoredDupeSearch): void {
  if (runningByProduct.get(job.productKey) === job.id) runningByProduct.delete(job.productKey);
}

async function readSearchingJob(
  job: StoredDupeSearch,
  readTask: (taskId: string) => Promise<DupeManusRead>
): Promise<DupeSearchJobView> {
  try {
    const task = await readTask(job.id);
    console.log('Dupe search status:', job.id, task.phase);
    if (task.phase === 'searching') return viewOf(job);
    if (task.phase === 'failed') {
      job.status = 'unavailable';
      job.error = 'Dupe search is temporarily unavailable';
      finishJob(job);
      console.error('Dupe search failed:', task.error || 'Manus task failed');
      return viewOf(job);
    }

    const interpreted = interpretDupeAnswer(job.product, {
      assistantText: task.assistantText,
      structured: task.structured,
    });
    job.status = 'complete';
    job.outcome = interpreted.outcome;
    job.results = interpreted.outcome === 'unusable' ? undefined : interpreted.results;
    job.error = interpreted.outcome === 'unusable' ? COULD_NOT_RETURN : undefined;
    finishJob(job);
    console.log(
      'Dupe search answer:',
      job.id,
      interpreted.outcome,
      'returned',
      interpreted.returnedCount,
      'shown',
      interpreted.results.length,
      'rejected',
      interpreted.rejected.map((item) => `${item.reason}: ${item.url || item.name}`).join('; ') || 'none',
      interpreted.reason || ''
    );
    return viewOf(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isDupeSearchUnavailable(message)) {
      job.status = 'unavailable';
      job.error = 'Dupe search is temporarily unavailable';
      if (runningByProduct.get(job.productKey) === job.id) runningByProduct.delete(job.productKey);
      console.error('Dupe search unavailable:', message);
      return viewOf(job);
    }
    console.warn('Dupe search status check failed; still searching:', message);
    return viewOf(job);
  }
}

function extractJson(text: string): unknown {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : text).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
