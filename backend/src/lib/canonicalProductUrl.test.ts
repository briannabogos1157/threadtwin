import assert from 'assert';
import { describe, it } from 'node:test';
import { canonicalProductUrl } from './canonicalProductUrl';

describe('canonicalProductUrl', () => {
  it('strips tracking parameters and keeps the product path and variant', () => {
    const tracked =
      'https://www.Shop.example/en_us/fashion/products/ABC12345_C888?utm_source=ig&utm_medium=paid&gclid=abc&gbraid=b&gad_source=1&color=red#reviews';
    const plain = 'https://www.shop.example/en_us/fashion/products/ABC12345_C888?color=red';

    assert.equal(canonicalProductUrl(tracked), 'https://www.shop.example/en_us/fashion/products/ABC12345_C888?color=red');
    assert.equal(canonicalProductUrl(plain), canonicalProductUrl(tracked));
  });

  it('treats two tracked copies of one product as the same cache identity', () => {
    const first = canonicalProductUrl(
      'https://shop.example/us/fashion/p/SKU83463/wool-top/?utm_campaign=spring&fbclid=zzz'
    );
    const second = canonicalProductUrl(
      'https://shop.example/us/fashion/p/SKU83463/wool-top/?gclid=yyy&utm_source=email'
    );
    assert.equal(first, second);
    assert.equal(first, 'https://shop.example/us/fashion/p/SKU83463/wool-top/');
  });

  it('rejects a value that is not an http product URL', () => {
    assert.equal(canonicalProductUrl(''), null);
    assert.equal(canonicalProductUrl('not a url'), null);
    assert.equal(canonicalProductUrl('ftp://shop.example/products/ABC12345'), null);
  });
});
