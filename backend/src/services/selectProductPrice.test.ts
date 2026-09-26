import assert from 'assert';
import { describe, it } from 'node:test';
import { collectPriceSignals, selectProductPrice } from './selectProductPrice';

const PAGE = 'https://shop.example/products/tee';

function htmlWith(options: {
  jsonLd?: string;
  meta?: string;
  mainPrice?: string;
  stray?: string;
}): string {
  return `<!doctype html><html><head>
    ${options.meta ? `<meta property="product:price:amount" content="${options.meta}">` : ''}
    ${options.jsonLd ? `<script type="application/ld+json">${options.jsonLd}</script>` : ''}
  </head><body><main>
    <h1>Supima Cotton Tee</h1>
    ${options.mainPrice ? `<div class="product-price">${options.mainPrice}</div>` : ''}
    <p>Standard shipping is $7.99.</p>
    <section class="carousel">
      <div class="tile"><span class="price">${options.stray ?? '$1.90'}</span></div>
    </section>
  </main></body></html>`;
}

describe('selectProductPrice', () => {
  it('prefers the Product JSON-LD offer over a stray dollar amount', () => {
    const html = htmlWith({
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        offers: {
          '@type': 'Offer',
          price: '19.90',
          priceCurrency: 'USD',
          url: PAGE,
        },
      }),
      mainPrice: '$19.90',
      stray: '$1.90',
    });
    const selected = selectProductPrice(collectPriceSignals(html), PAGE);
    assert.equal(selected.source, 'jsonld');
    assert.equal(selected.price, 19.9);
  });

  it('uses the product price meta tag before visible text', () => {
    const html = htmlWith({ meta: '24.00', stray: '$1.90' });
    const selected = selectProductPrice(collectPriceSignals(html), PAGE);
    assert.equal(selected.source, 'meta');
    assert.equal(selected.price, 24);
  });

  it('uses the main product price element and ignores carousel prices', () => {
    const html = htmlWith({ mainPrice: '$19.90', stray: '$1.90' });
    const signals = collectPriceSignals(html);
    assert.ok(signals.productPriceTexts.some((text) => text.includes('19.90')));
    assert.ok(!signals.productPriceTexts.some((text) => text.includes('1.90')));
    const selected = selectProductPrice(signals, PAGE);
    assert.equal(selected.source, 'product-element');
    assert.equal(selected.price, 19.9);
  });

  it('falls back to the first dollar amount only when structured prices are missing', () => {
    const html = `<!doctype html><html><body><p>Sale from $1.90 this week.</p></body></html>`;
    const selected = selectProductPrice(collectPriceSignals(html), PAGE);
    assert.equal(selected.source, 'generic');
    assert.equal(selected.price, 1.9);
  });

  it('reads prices from ProductGroup variants instead of a stray tile price', () => {
    const html = htmlWith({
      jsonLd: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ProductGroup',
            name: 'Tee',
            hasVariant: [
              {
                '@type': 'Product',
                offers: {
                  '@type': 'Offer',
                  price: '19.90',
                  priceCurrency: 'USD',
                  url: `${PAGE}?color=pink`,
                },
              },
            ],
          },
        ],
      }),
      stray: '$1.90',
    });
    const selected = selectProductPrice(collectPriceSignals(html), PAGE);
    assert.equal(selected.source, 'jsonld');
    assert.equal(selected.price, 19.9);
  });

  it('does not discard a structured price of 1.90', () => {
    const html = htmlWith({
      jsonLd: JSON.stringify({
        '@type': 'Product',
        offers: { '@type': 'Offer', price: '1.90', priceCurrency: 'USD', url: PAGE },
      }),
      mainPrice: '$19.90',
    });
    const selected = selectProductPrice(collectPriceSignals(html), PAGE);
    assert.equal(selected.source, 'jsonld');
    assert.equal(selected.price, 1.9);
  });
});
