import * as cheerio from 'cheerio';
import { materialSummaryFrom } from './materialSummary';
import { parseCurrencyAmount, parseLoosePrice, selectProductPrice, collectPriceSignals } from './selectProductPrice';

export interface ProductFacts {
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  onSale: boolean;
  availability: string;
  materialSummary: string;
  images: string[];
}

const NOISE_CLASS = ['tile', 'carousel', 'recommend', 'related', 'swiper'];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function typeNames(node: Record<string, unknown>): string[] {
  const typeValue = node['@type'];
  if (typeof typeValue === 'string') return [typeValue.toLowerCase()];
  if (!Array.isArray(typeValue)) return [];
  return typeValue.filter((item): item is string => typeof item === 'string').map((item) => item.toLowerCase());
}

function isProductNode(node: Record<string, unknown>): boolean {
  return typeNames(node).some((type) => type === 'product' || type === 'productgroup');
}

function walk(node: unknown, visit: (record: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) {
    node.forEach((item) => walk(item, visit));
    return;
  }
  const record = asRecord(node);
  if (!record) return;
  visit(record);
  if (record['@graph']) walk(record['@graph'], visit);
  if (record.hasVariant) walk(record.hasVariant, visit);
}

function decodeEntities(value: string): string {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    const next = current
      .replace(/&amp;/gi, '&')
      .replace(/&apos;|&#0?39;/gi, "'")
      .replace(/&quot;|&#0?34;/gi, '"')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
    if (next === current) break;
    current = next;
  }
  return current;
}

function stripHtml(value: string): string {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function compositionSnippet(text: string): string {
  const match = text.match(/(?:composition|shell|materials?)\s*[:\-]?\s*.{0,180}/i);
  return match ? match[0] : '';
}

function clip(value: string, max = 420): string {
  const clean = stripHtml(value);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max).replace(/\s+\S*$/, '');
  return `${cut}…`;
}

function absoluteUrl(raw: string, pageUrl: string): string {
  try {
    const url = new URL(raw, pageUrl);
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.href;
  } catch {
    return raw;
  }
}

function imageUrls(value: unknown, pageUrl: string): string[] {
  const urls: string[] = [];
  const add = (raw: unknown) => {
    if (typeof raw === 'string' && /^https?:\/\//i.test(raw)) urls.push(absoluteUrl(raw, pageUrl));
    const record = asRecord(raw);
    if (record && typeof record.url === 'string') add(record.url);
    if (record && typeof record.contentUrl === 'string') add(record.contentUrl);
  };
  if (Array.isArray(value)) value.forEach(add);
  else add(value);
  return [...new Set(urls)].filter((url) => !/\.svg($|\?)/i.test(url)).slice(0, 4);
}

function availabilityFromToken(token: string): string {
  const normalized = token.toLowerCase();
  if (normalized.includes('instock')) return 'In stock';
  if (normalized.includes('outofstock') || normalized.includes('soldout')) return 'Out of stock';
  if (normalized.includes('preorder') || normalized.includes('pre-order')) return 'Pre-order';
  if (normalized.includes('limitedavailability')) return 'Limited availability';
  if (normalized.includes('instoreonly')) return 'In store only';
  return '';
}

function summarizeAvailability(tokens: string[]): string {
  const labels = tokens.map(availabilityFromToken).filter(Boolean);
  if (labels.includes('In stock')) return 'In stock';
  if (labels.includes('Limited availability')) return 'Limited availability';
  if (labels.includes('Pre-order')) return 'Pre-order';
  if (labels.includes('Out of stock')) return 'Out of stock';
  return labels[0] || '';
}

function offerList(node: Record<string, unknown>): Record<string, unknown>[] {
  const raw = node.offers;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map(asRecord).filter((offer): offer is Record<string, unknown> => offer !== null);
}

function specPrices(spec: unknown): { current: number | null; list: number | null } {
  const entries = Array.isArray(spec) ? spec : spec ? [spec] : [];
  let current: number | null = null;
  let list: number | null = null;
  entries.forEach((entry) => {
    const record = asRecord(entry);
    if (!record) return;
    const price = parseLoosePrice(record.price);
    if (price == null) return;
    const type = String(record.priceType || '');
    if (/listprice/i.test(type)) list = price;
    else if (/saleprice/i.test(type)) current = price;
    else if (current == null) current = price;
  });
  if (current == null && list != null) current = list;
  if (list != null && current != null && list <= current) list = null;
  return { current, list };
}

interface StructuredCommerce {
  name: string;
  description: string;
  price: number | null;
  listPrice: number | null;
  availability: string;
  material: string;
  images: string[];
}

function readStructured(blocks: unknown[], pageUrl: string): StructuredCommerce {
  const facts: StructuredCommerce = {
    name: '',
    description: '',
    price: null,
    listPrice: null,
    availability: '',
    material: '',
    images: [],
  };
  const availability: string[] = [];

  blocks.forEach((block) => {
    walk(block, (node) => {
      if (!isProductNode(node)) return;
      if (!facts.name && typeof node.name === 'string') facts.name = node.name.trim();
      if (!facts.description && typeof node.description === 'string') facts.description = clip(node.description);
      if (!facts.material && typeof node.material === 'string') facts.material = node.material;
      if (!facts.images.length) facts.images = imageUrls(node.image, pageUrl);

      offerList(node).forEach((offer) => {
        if (typeof offer.availability === 'string') availability.push(offer.availability);
        const spec = specPrices(offer.priceSpecification);
        const direct = parseLoosePrice(offer.price ?? offer.lowPrice);
        const current = spec.current ?? direct;
        if (facts.price == null && current != null) facts.price = current;
        if (facts.listPrice == null && spec.list != null) facts.listPrice = spec.list;
      });
    });
  });

  facts.availability = summarizeAvailability(availability);
  return facts;
}

function isNoisy(className: string): boolean {
  const normalized = className.toLowerCase();
  return NOISE_CLASS.some((token) => normalized.includes(token));
}

function loadJsonLd($: cheerio.CheerioAPI): unknown[] {
  const blocks: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    if (!raw.trim()) return;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Keep going. Visible product data can still fill the gaps.
    }
  });
  return blocks;
}

function productScope($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  let node = $('h1').first();
  if (!node.length) return $('body');
  while (node.length) {
    const parent = node.parent();
    if (!parent.length || /^(body|html)$/i.test(parent.get(0)?.tagName || '')) break;
    node = parent;
    const clone = node.clone();
    clone.find('[class*="tile"], [class*="carousel"], [class*="recommend"], [class*="related"], [class*="swiper"]').remove();
    if (/\$\s*\d/.test(clone.text())) {
      const wider = node.parent();
      if (wider.length && !/^(body|html)$/i.test(wider.get(0)?.tagName || '')) return wider;
      return node;
    }
  }
  return $('body');
}

function visibleCommerce($: cheerio.CheerioAPI, scope: cheerio.Cheerio<any>): {
  price: number | null;
  originalPrice: number | null;
  availability: string;
  materialText: string;
} {
  const clone = scope.clone();
  clone.find('[class*="tile"], [class*="carousel"], [class*="recommend"], [class*="related"], [class*="swiper"]').remove();

  const compareAmounts: number[] = [];
  clone.find('[class*="compare-at"], [class*="compareat"], [class*="was-price"], [class*="original-price"], s, del').each((_, el) => {
    if (isNoisy($(el).attr('class') || '')) return;
    const amount = parseCurrencyAmount($(el).text());
    if (amount != null) compareAmounts.push(amount);
  });

  const dollars = clone.text().match(/\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g) || [];
  const amounts = dollars
    .map((value) => parseCurrencyAmount(value))
    .filter((value): value is number => value != null);
  const current = amounts.find((amount) => !compareAmounts.includes(amount)) ?? amounts[0] ?? null;
  const original = compareAmounts.find((amount) => current != null && amount > current) ?? null;

  const text = clone.text().replace(/\s+/g, ' ');
  let availability = '';
  if (/\b(sold out|out of stock|notify me)\b/i.test(text)) availability = 'Out of stock';
  else if (/\b(add to (bag|cart|basket)|in stock)\b/i.test(text)) availability = 'In stock';

  return { price: current, originalPrice: original, availability, materialText: text };
}

function isPriceRefinement(structured: number, visible: number): boolean {
  return visible !== structured && Math.abs(visible - structured) < 1;
}

export function extractProductFacts(html: string, pageUrl: string): ProductFacts {
  const $ = cheerio.load(html);
  const structured = readStructured(loadJsonLd($), pageUrl);
  const scope = productScope($);
  const visible = visibleCommerce($, scope);

  let price = structured.price ?? 0;
  let originalPrice = structured.listPrice;
  if (visible.price != null && (price === 0 || isPriceRefinement(price, visible.price))) {
    price = visible.price;
  }
  if (originalPrice == null && visible.originalPrice != null && visible.originalPrice > price) {
    originalPrice = visible.originalPrice;
  }
  if (price === 0) {
    price = selectProductPrice(collectPriceSignals(html), pageUrl).price;
  }

  const onSale = originalPrice != null && price > 0 && originalPrice > price;

  const metaDescription =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';
  const description = structured.description || clip(metaDescription);

  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const images = structured.images.length
    ? structured.images
    : ogImage
      ? imageUrls(ogImage, pageUrl)
      : [];

  const cleanedBody = $('body').clone();
  cleanedBody.find('[class*="tile"], [class*="carousel"], [class*="recommend"], [class*="related"], [class*="swiper"]').remove();
  const pageText = cleanedBody.text().replace(/\s+/g, ' ');
  const materialSource = [structured.material, compositionSnippet(pageText), visible.materialText, description]
    .filter(Boolean)
    .join(' ');
  const materialSummary = materialSummaryFrom(materialSource, []);

  const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim();
  const name = structured.name || h1;

  return {
    name,
    description,
    price,
    originalPrice: onSale ? originalPrice : null,
    onSale,
    availability: structured.availability || visible.availability || (
      /add to (?:bag|cart|basket)/i.test(pageText) ? 'In stock' : ''
    ),
    materialSummary,
    images,
  };
}
