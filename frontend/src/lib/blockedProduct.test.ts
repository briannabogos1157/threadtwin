import assert from 'assert';
import { describe, it } from 'node:test';
import { blockStatusLine, isBlockedAnalysis, savedProductFromRecord } from './blockedProduct';

const URL = 'https://www2.hm.com/en_us/productpage.0963662139.html';

describe('blocked product fallback', () => {
  it('treats an HTTP 403 and a bot-check as a blocked refresh', () => {
    assert.equal(
      isBlockedAnalysis({ details: 'Failed to scrape product details: Product page returned HTTP 403' }),
      true
    );
    assert.equal(isBlockedAnalysis({ details: 'Product page blocked the request' }), true);
    assert.equal(isBlockedAnalysis({ details: 'Scrape timeout' }), false);
    assert.equal(
      blockStatusLine({ details: 'Product page returned HTTP 403' }),
      'The retailer returned HTTP 403.'
    );
  });

  it('does not invent a product from a URL-only save', () => {
    assert.equal(savedProductFromRecord({ url: URL }, URL), null);
    assert.equal(savedProductFromRecord({ name: 'Product', price: 0 }, URL), null);
  });

  it('keeps saved name, sale price, and photo', () => {
    const saved = savedProductFromRecord(
      {
        name: 'Off Duty T-Shirt',
        price: 21.6,
        originalPrice: 36,
        onSale: true,
        imageUrl: 'https://cdn.example/tee.jpg',
        fabric: '100% Organic Cotton',
        description: 'A soft tee.',
      },
      URL
    );
    assert.ok(saved);
    assert.equal(saved?.name, 'Off Duty T-Shirt');
    assert.equal(saved?.price, 21.6);
    assert.equal(saved?.originalPrice, 36);
    assert.equal(saved?.onSale, true);
    assert.equal(saved?.imageUrl, 'https://cdn.example/tee.jpg');
    assert.equal(saved?.fabric, '100% Organic Cotton');
  });
});
