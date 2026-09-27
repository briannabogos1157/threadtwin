import assert from 'assert';
import { describe, it } from 'node:test';
import { interpretBlockedProduct } from './blockedProductEnrichment';
import { resolveScrapeFailure } from './analyzeBlocked';
import type { BlockedProductDetails } from './blockedProductEnrichment';

const REQUESTED = 'https://shop.example/fashion/products/ABC12345_C888?utm_source=ig';
const CANONICAL = 'https://shop.example/fashion/products/ABC12345_C888';

function verified(overrides: Record<string, unknown> = {}) {
  return {
    verified: true,
    product: {
      name: 'Wool Crew Sweater',
      retailer: 'Example',
      url: CANONICAL,
      imageUrl: 'https://cdn.example/sweater.jpg',
      currentPrice: 3200,
      originalPrice: null,
      currency: 'USD',
      fabric: '100% wool',
      fit: 'relaxed',
      construction: ['crew neck'],
      description: 'Wool sweater with a crew neck.',
      availability: 'in_stock',
      ...overrides,
    },
  };
}

describe('interpretBlockedProduct', () => {
  it('accepts the exact product and keeps only verified fields', () => {
    const product = interpretBlockedProduct(CANONICAL, verified({
      currentPrice: null,
      imageUrl: null,
      fabric: null,
      fit: null,
      construction: [],
      description: null,
      availability: 'unknown',
      originalPrice: null,
    }));

    assert.ok(product);
    assert.equal(product?.name, 'Wool Crew Sweater');
    assert.equal(product?.url, CANONICAL);
    assert.equal(product?.source, 'manus-fallback');
    assert.equal(product?.price, 0);
    assert.equal(product?.originalPrice, null);
    assert.equal(product?.onSale, false);
    assert.deepEqual(product?.images, []);
    assert.equal(product?.materialSummary, undefined);
    assert.equal(product?.description, '');
    assert.equal(product?.availability, '');
    assert.deepEqual(product?.fit, []);
    assert.deepEqual(product?.construction, []);
  });

  it('rejects a different product on the same retailer', () => {
    const product = interpretBlockedProduct(CANONICAL, verified({
      name: 'Another Sweater',
      url: 'https://shop.example/fashion/products/OTHER99999',
    }));
    assert.equal(product, null);
  });

  it('rejects a search page even when it mentions the product code', () => {
    const product = interpretBlockedProduct(CANONICAL, verified({
      url: 'https://shop.example/search?q=ABC12345_C888',
    }));
    assert.equal(product, null);
  });

  it('rejects an explicit unverified answer', () => {
    const product = interpretBlockedProduct(CANONICAL, { ...verified(), verified: false });
    assert.equal(product, null);
  });

  it('rejects a placeholder name', () => {
    const product = interpretBlockedProduct(CANONICAL, verified({ name: 'Product' }));
    assert.equal(product, null);
  });

  it('rejects the same code on a different host', () => {
    const product = interpretBlockedProduct(CANONICAL, verified({
      url: 'https://other.example/fashion/products/ABC12345_C888',
    }));
    assert.equal(product, null);
  });

  it('keeps a verified price, image, fabric, fit, and sale price', () => {
    const product = interpretBlockedProduct(CANONICAL, verified({ originalPrice: 4000 }));
    assert.equal(product?.price, 3200);
    assert.equal(product?.originalPrice, 4000);
    assert.equal(product?.onSale, true);
    assert.deepEqual(product?.images, ['https://cdn.example/sweater.jpg']);
    assert.equal(product?.materialSummary, '100% wool');
    assert.deepEqual(product?.fit, ['relaxed']);
    assert.deepEqual(product?.construction, ['crew neck']);
    assert.equal(product?.description, 'Wool sweater with a crew neck.');
    assert.equal(product?.availability, 'In stock');
    assert.equal(product?.retailer, 'Example');
  });

  it('drops a placeholder image instead of inventing one', () => {
    const product = interpretBlockedProduct(CANONICAL, verified({
      imageUrl: 'https://placehold.co/400x600',
    }));
    assert.deepEqual(product?.images, []);
    assert.equal(product?.name, 'Wool Crew Sweater');
  });
});

describe('resolveScrapeFailure', () => {
  const enriched: BlockedProductDetails = {
    name: 'Wool Crew Sweater',
    price: 3200,
    originalPrice: null,
    onSale: false,
    availability: 'In stock',
    description: 'Wool sweater with a crew neck.',
    fabricComposition: [],
    materialSummary: '100% wool',
    construction: ['crew neck'],
    fit: ['relaxed'],
    careInstructions: [],
    images: ['https://cdn.example/sweater.jpg'],
    url: CANONICAL,
    retailer: 'Example',
    source: 'manus-fallback',
  };

  it('uses Manus when the scraper is blocked and keeps the product when it is verified', async () => {
    let enrichedUrl = '';
    const outcome = await resolveScrapeFailure({
      scrapeMessage: 'Failed to scrape product details: Product page returned HTTP 403',
      canonicalUrl: CANONICAL,
      manusConfigured: true,
      enrichBlocked: async (url) => {
        enrichedUrl = url;
        return enriched;
      },
      fallback: async () => {
        throw new Error('non-block fallback should not run');
      },
    });

    assert.equal(enrichedUrl, CANONICAL);
    assert.equal(outcome.ok, true);
    if (outcome.ok) assert.equal(outcome.product.source, 'manus-fallback');
  });

  it('keeps the blocked state when Manus cannot verify the product', async () => {
    const outcome = await resolveScrapeFailure({
      scrapeMessage: 'Product page blocked the request',
      canonicalUrl: CANONICAL,
      manusConfigured: true,
      enrichBlocked: async () => null,
      fallback: async () => {
        throw new Error('non-block fallback should not run');
      },
    });

    assert.equal(outcome.ok, false);
    if (!outcome.ok) {
      assert.equal(outcome.status, 502);
      assert.match(String(outcome.body.details), /blocked the request/);
    }
  });

  it('keeps the blocked state when the Manus request fails', async () => {
    const outcome = await resolveScrapeFailure({
      scrapeMessage: 'Failed to scrape product details: Product page returned HTTP 403',
      canonicalUrl: CANONICAL,
      manusConfigured: true,
      enrichBlocked: async () => {
        throw new Error('Manus task.create failed: 503');
      },
      fallback: async () => {
        throw new Error('non-block fallback should not run');
      },
    });

    assert.equal(outcome.ok, false);
    if (!outcome.ok) assert.match(String(outcome.body.details), /HTTP 403/);
  });

  it('does not call Manus for a blocked page when the key is missing', async () => {
    let calls = 0;
    const outcome = await resolveScrapeFailure({
      scrapeMessage: 'Product page blocked the request',
      canonicalUrl: CANONICAL,
      manusConfigured: false,
      enrichBlocked: async () => {
        calls += 1;
        return enriched;
      },
      fallback: async () => {
        calls += 1;
        return enriched;
      },
    });

    assert.equal(calls, 0);
    assert.equal(outcome.ok, false);
  });

  it('canonical tracked and plain URLs are one enrichment identity', () => {
    assert.equal(
      interpretBlockedProduct(REQUESTED, verified())?.url,
      CANONICAL
    );
  });
});
