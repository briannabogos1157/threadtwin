import assert from 'assert';
import { describe, it } from 'node:test';
import { canonicalProductUrl } from './canonicalProductUrl';

describe('canonicalProductUrl', () => {
  it('drops tracking parameters from one product path', () => {
    assert.equal(
      canonicalProductUrl(
        'https://www.Shop.example/fashion/products/ABC12345?utm_source=ig&gclid=1&color=navy'
      ),
      canonicalProductUrl('https://www.shop.example/fashion/products/ABC12345?color=navy')
    );
  });
});
