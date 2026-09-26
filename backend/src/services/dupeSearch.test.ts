import assert from 'assert';
import { afterEach, describe, it } from 'node:test';
import {
  inferProductType,
  interpretDupeAnswer,
  isDupeSearchUnavailable,
  normalizeSearchProduct,
  productUrlRejection,
  readDupeSearch,
  resetDupeSearches,
  retailerFromUrl,
  scoreCandidates,
  startDupeSearch,
  type DupeSearchProduct,
} from './dupeSearch';

const ORIGINAL: DupeSearchProduct = {
  name: 'Contrast Print Regular Fit T-Shirt',
  productType: 't-shirt',
  fabric: '100% Cotton',
  fabricComposition: ['cotton'],
  fit: ['regular'],
  construction: ['knit'],
  care: ['machine wash'],
  price: 69.9,
  originalPrice: null,
  description: 'Regular fit T-shirt in cotton jersey.',
  retailer: 'zara.com',
  url: 'https://www.zara.com/us/en/regular-fit-contrast-print-t-shirt-p06085008.html',
};

describe('dupe search', () => {
  it('reads the retailer from the product URL and the type from the name', () => {
    assert.equal(
      retailerFromUrl('https://www.zara.com/us/en/regular-fit-contrast-print-t-shirt-p06085008.html'),
      'zara.com'
    );
    assert.equal(inferProductType('Contrast Print Regular Fit T-Shirt'), 't-shirt');
    assert.equal(inferProductType('Off Duty T-Shirt', 'A soft tee'), 't-shirt');
  });

  it('keeps analyzed fabric, fit, price, and sale price on the search product', () => {
    const product = normalizeSearchProduct({
      product: {
        name: 'Off Duty T-Shirt',
        fabric: '100% Organic Cotton',
        fit: ['Regular'],
        construction: ['Knit'],
        price: 21.6,
        originalPrice: 36,
        onSale: true,
        description: 'Soft organic cotton tee.',
        url: 'https://www.gymshark.com/products/gymshark-off-duty-t-shirt-ss-tops-black-ss26',
      },
    });
    assert.equal(product?.fabric, '100% Organic Cotton');
    assert.deepEqual(product?.fit, ['regular']);
    assert.equal(product?.price, 21.6);
    assert.equal(product?.originalPrice, 36);
    assert.equal(product?.onSale, true);
    assert.equal(product?.retailer, 'gymshark.com');
    assert.equal(product?.productType, 't-shirt');
  });

  it('scores fabric and construction and ignores a sale price', () => {
    const shared = {
      title: 'Soft Cotton Tee',
      retailer: 'Example Retailer',
      link: 'https://shop.example-retailer.com/products/soft-cotton-tee',
      imageUrl: 'https://cdn.example-retailer.com/tee.jpg',
      fabric: '100% cotton',
      fit: ['regular'],
      construction: ['knit'],
      care: ['machine wash'],
    };
    const [sale] = scoreCandidates(ORIGINAL, [{ ...shared, price: 18, originalPrice: 40 }]);
    const [full] = scoreCandidates(ORIGINAL, [{
      ...shared,
      link: 'https://shop.example-retailer.com/products/soft-cotton-tee-full',
      price: 70,
      originalPrice: null,
    }]);

    assert.equal(sale.onSale, true);
    assert.equal(sale.price, 18);
    assert.equal(sale.originalPrice, 40);
    assert.equal(sale.match.fabric, 100);
    assert.equal(sale.match.construction, 100);
    assert.deepEqual(sale.match, full.match);
  });

  it('drops fake links and the source product', () => {
    const results = scoreCandidates(ORIGINAL, [
      {
        title: 'Ribbed Bodycon Dress',
        retailer: 'H&M',
        price: '$29.99',
        link: 'https://www.hm.com/mock-product',
        fabric: 'cotton',
      },
      {
        title: 'Same Shirt',
        link: ORIGINAL.url,
        fabric: 'cotton',
      },
      {
        title: 'Real Cotton Tee',
        link: 'https://shop.example-retailer.com/products/real-cotton-tee',
        fabric: '100% cotton',
        fit: ['regular'],
        construction: ['knit'],
        price: 25,
      },
    ]);
    assert.equal(results.length, 1);
    assert.equal(results[0].name, 'Real Cotton Tee');
    assert.equal(results[0].url, 'https://shop.example-retailer.com/products/real-cotton-tee');
  });

  it('rejects homepages, search pages, category pages, and mock links', () => {
    assert.equal(productUrlRejection('https://www.zara.com/'), 'homepage');
    assert.equal(productUrlRejection('https://www.zara.com/search?q=tee'), 'search results page');
    assert.equal(productUrlRejection('https://www.zara.com/us/en/woman-tshirts-l1245.html'), 'category page');
    assert.equal(productUrlRejection('https://shop.example-retailer.com/collections/tees'), 'category page');
    assert.equal(productUrlRejection('https://www.hm.com/mock-product'), 'mock or placeholder link');
    assert.equal(
      productUrlRejection('https://shop.example-retailer.com/products/real-cotton-tee'),
      null
    );
  });

  it('treats an explicit empty product list differently from a completion with no answer', () => {
    const empty = interpretDupeAnswer(ORIGINAL, {
      structured: { success: true, value: { products: [] }, error: null },
    });
    assert.equal(empty.outcome, 'none');
    assert.equal(empty.returnedCount, 0);

    const failedExtraction = interpretDupeAnswer(ORIGINAL, {
      structured: { success: false, value: { products: [] }, error: 'Failed to extract structured output' },
    });
    assert.equal(failedExtraction.outcome, 'unusable');

    const noAnswer = interpretDupeAnswer(ORIGINAL, { assistantText: '', structured: null });
    assert.equal(noAnswer.outcome, 'unusable');
    assert.equal(noAnswer.reason, 'completed with no assistant response');
  });

  it('parses fenced JSON and rejects a category page without inventing products', () => {
    const parsed = interpretDupeAnswer(ORIGINAL, {
      assistantText: '```json\n{"products":[{"name":"Real Cotton Tee","retailer":"Shop","url":"https://shop.example-retailer.com/products/real-cotton-tee","imageUrl":null,"currentPrice":25,"originalPrice":null,"currency":"USD","fabric":"100% cotton","fit":"Regular","construction":["knit"],"care":[],"availability":"in_stock"},{"name":"Category","retailer":"Shop","url":"https://shop.example-retailer.com/collections/tees","imageUrl":null,"currentPrice":20,"originalPrice":null,"currency":"USD","fabric":null,"fit":null,"construction":[],"care":[],"availability":"unknown"}]}\n```',
    });
    assert.equal(parsed.outcome, 'results');
    assert.equal(parsed.returnedCount, 2);
    assert.equal(parsed.results.length, 1);
    assert.equal(parsed.results[0].name, 'Real Cotton Tee');
    assert.equal(parsed.results[0].fabric, '100% cotton');
    assert.equal(parsed.results[0].match.fabric, 100);
    assert.equal(parsed.rejected.length, 1);
    assert.equal(parsed.rejected[0].reason, 'category page');

    const malformed = interpretDupeAnswer(ORIGINAL, { assistantText: 'I found a few shirts.' });
    assert.equal(malformed.outcome, 'unusable');
  });

  it('treats a missing or rejected Manus key as unavailable', () => {
    assert.equal(isDupeSearchUnavailable('MANUS_API_KEY is not configured'), true);
    assert.equal(
      isDupeSearchUnavailable('Manus create task failed: 401 {"message":"api key has been deleted or does not exist"}'),
      true
    );
    assert.equal(isDupeSearchUnavailable('Scrape timeout'), false);
  });
});

describe('dupe search tasks', () => {
  afterEach(() => {
    resetDupeSearches();
  });

  it('creates one Manus task when Find Dupes is clicked twice for the same product', async () => {
    let calls = 0;
    const create = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'task-abc12345';
    };
    const [first, second] = await Promise.all([
      startDupeSearch(ORIGINAL, create),
      startDupeSearch(ORIGINAL, create),
    ]);
    assert.equal(calls, 1);
    assert.equal(first.searchId, 'task-abc12345');
    assert.equal(second.searchId, first.searchId);
    assert.equal(first.status, 'searching');
  });

  it('keeps searching when a status check fails and returns saved results after completion', async () => {
    await startDupeSearch(ORIGINAL, async () => 'task-abc12345');
    const still = await readDupeSearch('task-abc12345', async () => {
      throw new Error('socket hang up');
    });
    assert.equal(still?.status, 'searching');

    const done = await readDupeSearch('task-abc12345', async () => ({
      phase: 'finished',
      assistantText: '',
      structured: {
        success: true,
        value: {
          products: [{
            name: 'Real Cotton Tee',
            retailer: 'shop.example-retailer.com',
            url: 'https://shop.example-retailer.com/products/real-cotton-tee',
            imageUrl: 'https://cdn.example-retailer.com/tee.jpg',
            currentPrice: 25,
            originalPrice: null,
            currency: 'USD',
            fabric: '100% cotton',
            fit: 'Regular',
            construction: ['knit'],
            care: [],
            availability: 'in_stock',
          }],
        },
        error: null,
      },
    }));
    assert.equal(done?.status, 'complete');
    assert.equal(done?.outcome, 'results');
    assert.equal(done?.results?.length, 1);
    assert.equal(done?.results?.[0].name, 'Real Cotton Tee');

    const cached = await readDupeSearch('task-abc12345', async () => {
      throw new Error('should not read Manus again');
    });
    assert.equal(cached?.status, 'complete');
    assert.equal(cached?.results?.length, 1);
  });

  it('marks a failed Manus task unavailable without inventing products', async () => {
    await startDupeSearch(ORIGINAL, async () => 'task-failed1');
    const failed = await readDupeSearch('task-failed1', async () => ({
      phase: 'failed',
      error: 'agent stopped',
      assistantText: '',
      structured: null,
    }));
    assert.equal(failed?.status, 'unavailable');
    assert.equal(failed?.error, 'Dupe search is temporarily unavailable');
    assert.equal(failed?.results, undefined);
  });
});
