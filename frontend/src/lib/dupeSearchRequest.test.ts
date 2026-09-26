import assert from 'assert';
import { describe, it } from 'node:test';
import { dupeSearchBody } from './dupeSearchRequest';

describe('dupeSearchBody', () => {
  it('passes the analyzed product into search without asking for the name again', () => {
    const body = dupeSearchBody({
      name: 'Off Duty T-Shirt',
      price: 21.6,
      originalPrice: 36,
      onSale: true,
      description: 'A soft organic cotton tee.',
      url: 'https://www.gymshark.com/products/gymshark-off-duty-t-shirt-ss-tops-black-ss26',
      fabric: '100% Organic Cotton',
      fabricComposition: ['cotton'],
      fit: ['regular'],
      construction: ['knit'],
      care: ['machine wash'],
    });

    assert.equal(body.product.name, 'Off Duty T-Shirt');
    assert.equal(body.product.productType, 't-shirt');
    assert.equal(body.product.fabric, '100% Organic Cotton');
    assert.deepEqual(body.product.fit, ['regular']);
    assert.deepEqual(body.product.construction, ['knit']);
    assert.equal(body.product.price, 21.6);
    assert.equal(body.product.originalPrice, 36);
    assert.equal(body.product.onSale, true);
    assert.equal(body.product.retailer, 'gymshark.com');
    assert.equal(body.product.description, 'A soft organic cotton tee.');
  });
});
