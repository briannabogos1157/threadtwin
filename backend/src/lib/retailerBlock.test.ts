import assert from 'assert';
import { describe, it } from 'node:test';
import { isRetailerBlock } from './retailerBlock';

describe('isRetailerBlock', () => {
  it('recognizes an HTTP 403 and a bot-check page', () => {
    assert.equal(isRetailerBlock('Failed to scrape product details: Product page returned HTTP 403'), true);
    assert.equal(isRetailerBlock('Product page blocked the request'), true);
    assert.equal(isRetailerBlock("Could not read product title (blocked or access denied)"), true);
    assert.equal(isRetailerBlock("We've noticed some unusual activity"), true);
  });

  it('does not treat a normal scrape failure as a retailer block', () => {
    assert.equal(isRetailerBlock('Scrape timeout'), false);
    assert.equal(isRetailerBlock('Could not find product name'), false);
  });
});
