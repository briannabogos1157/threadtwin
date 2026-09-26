import * as cheerio from 'cheerio';

export type PriceSource = 'jsonld' | 'meta' | 'product-element' | 'generic' | 'none';

export interface PriceSignals {
  jsonLd: unknown[];
  metaAmounts: string[];
  productPriceTexts: string[];
  genericDollarTexts: string[];
}

export interface SelectedPrice {
  price: number;
  source: PriceSource;
}

const NOISE_CLASS = ['tile', 'carousel', 'recommend', 'related'];

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function amountFromMatch(whole: string, fraction?: string): number | null {
  const normalized = `${whole.replace(/,/g, '')}${fraction ? `.${fraction}` : ''}`;
  const price = parseFloat(normalized);
  if (!Number.isFinite(price) || price <= 0) return null;
  return roundMoney(price);
}

/** Numeric price fields from JSON-LD or meta content. */
export function parseLoosePrice(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? roundMoney(raw) : null;
  }
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^(?:USD|US\$|\$)?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/i);
  if (!match) return null;
  return amountFromMatch(match[1], match[2]);
}

/** A currency amount inside longer visible text. Requires a dollar sign. */
export function parseCurrencyAmount(raw: string): number | null {
  const match = raw.match(/\$\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/);
  if (!match) return null;
  return amountFromMatch(match[1], match[2]);
}

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

function walkNodes(node: unknown, visit: (record: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) {
    node.forEach((item) => walkNodes(item, visit));
    return;
  }
  const record = asRecord(node);
  if (!record) return;
  visit(record);
  if (record['@graph']) walkNodes(record['@graph'], visit);
  if (record.hasVariant) walkNodes(record.hasVariant, visit);
}

function priceFromOffer(offer: Record<string, unknown>): number | null {
  const direct = parseLoosePrice(offer.price ?? offer.lowPrice);
  if (direct != null) return direct;
  const spec = asRecord(offer.priceSpecification);
  if (!spec) return null;
  return parseLoosePrice(spec.price);
}

function urlsMatch(offerUrl: string, pageUrl: string): boolean {
  try {
    const offer = new URL(offerUrl);
    const page = new URL(pageUrl);
    return offer.origin === page.origin && offer.pathname === page.pathname;
  } catch {
    return offerUrl.split('?')[0] === pageUrl.split('?')[0];
  }
}

function priceFromJsonLd(blocks: unknown[], pageUrl?: string): number | null {
  const offers: { price: number; url?: string }[] = [];

  blocks.forEach((block) => {
    walkNodes(block, (node) => {
      if (!typeNames(node).includes('product')) return;
      const rawOffers = node.offers;
      const list = Array.isArray(rawOffers) ? rawOffers : rawOffers ? [rawOffers] : [];
      list.forEach((item) => {
        const offer = asRecord(item);
        if (!offer) return;
        const price = priceFromOffer(offer);
        if (price == null) return;
        offers.push({
          price,
          url: typeof offer.url === 'string' ? offer.url : undefined,
        });
      });
    });
  });

  if (!offers.length) return null;
  if (pageUrl) {
    const matched = offers.find((offer) => offer.url && urlsMatch(offer.url, pageUrl));
    if (matched) return matched.price;
  }
  return offers[0].price;
}

function firstParsed(values: string[], parse: (value: string) => number | null): number | null {
  for (const value of values) {
    const price = parse(value);
    if (price != null) return price;
  }
  return null;
}

export function selectProductPrice(signals: PriceSignals, pageUrl?: string): SelectedPrice {
  const fromJsonLd = priceFromJsonLd(signals.jsonLd, pageUrl);
  if (fromJsonLd != null) return { price: fromJsonLd, source: 'jsonld' };

  const fromMeta = firstParsed(signals.metaAmounts, (value) => parseLoosePrice(value) ?? parseCurrencyAmount(value));
  if (fromMeta != null) return { price: fromMeta, source: 'meta' };

  const fromElement = firstParsed(signals.productPriceTexts, (value) => parseCurrencyAmount(value) ?? parseLoosePrice(value));
  if (fromElement != null) return { price: fromElement, source: 'product-element' };

  const fromGeneric = firstParsed(signals.genericDollarTexts, parseCurrencyAmount);
  if (fromGeneric != null) return { price: fromGeneric, source: 'generic' };

  return { price: 0, source: 'none' };
}

function isNoisyClass(className: string): boolean {
  const normalized = className.toLowerCase();
  return NOISE_CLASS.some((token) => normalized.includes(token));
}

function collectJsonLd($: cheerio.CheerioAPI): unknown[] {
  const blocks: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    if (!raw.trim()) return;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Ignore malformed blocks and keep looking.
    }
  });
  return blocks;
}

function collectMetaAmounts($: cheerio.CheerioAPI): string[] {
  const amounts: string[] = [];
  $('meta[property="product:price:amount"], meta[property="og:price:amount"], meta[itemprop="price"], meta[name="price"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content?.trim()) amounts.push(content.trim());
  });
  return amounts;
}

function elementIsNoise($: cheerio.CheerioAPI, el: any): boolean {
  if (isNoisyClass($(el).attr('class') || '')) return true;
  const parents = $(el).parents().toArray();
  return parents.some((parent) => isNoisyClass($(parent).attr('class') || ''));
}

function shortPriceText($: cheerio.CheerioAPI, el: any): string {
  const content = ($(el).attr('content') || '').trim();
  if (content) return content;
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  if (text && text.length <= 40) return text;
  const aria = ($(el).attr('aria-label') || '').trim();
  if (aria && aria.length <= 80) return aria;
  return '';
}

/**
 * Read price signals from rendered HTML.
 * Product-element prices ignore recommendation tiles and carousels.
 * Generic dollar text is only the fallback list.
 */
export function collectPriceSignals(html: string): PriceSignals {
  const $ = cheerio.load(html);
  const jsonLd = collectJsonLd($);
  const metaAmounts = collectMetaAmounts($);

  let scope = $('h1').first();
  if (!scope.length) scope = $('body');

  while (scope.length) {
    const pricesHere = scope.find('[itemprop="price"], [class*="price"]').filter((_, el) => !elementIsNoise($, el));
    if (pricesHere.length) break;
    const parent = scope.parent();
    if (!parent.length || parent.get(0) === scope.get(0)) break;
    scope = parent;
  }

  const productPriceTexts: string[] = [];
  scope.find('[itemprop="price"], [class*="price"]').each((_, el) => {
    if (elementIsNoise($, el)) return;
    const text = shortPriceText($, el);
    if (text) productPriceTexts.push(text);
  });

  const genericRoot = scope.clone();
  genericRoot.find('[class*="tile"], [class*="carousel"], [class*="recommend"], [class*="related"]').remove();
  const genericDollarTexts = genericRoot.text().match(/\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g) || [];

  return {
    jsonLd,
    metaAmounts,
    productPriceTexts,
    genericDollarTexts,
  };
}
