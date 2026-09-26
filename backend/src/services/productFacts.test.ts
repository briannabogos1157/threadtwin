import assert from 'assert';
import { describe, it } from 'node:test';
import { extractProductFacts } from './productFacts';

const PAGE = 'https://shop.example/products/tee';

describe('extractProductFacts', () => {
  it('reads a product that only publishes visible price, description, and composition', () => {
    const html = `<!doctype html><html><head>
      <meta property="og:image" content="https://cdn.example/main.jpg">
      <meta name="description" content="Regular fit T-shirt. Crew neck and wide sleeves.">
    </head><body>
      <img src="https://cdn.example/recommendation.jpg">
      <h1>Contrast Print Regular Fit T-Shirt</h1>
      <div class="buybox">
        <p>$ 69.90</p>
        <button>Add to cart</button>
        <p>Composition: 100% cotton</p>
      </div>
      <section class="carousel"><span class="price">$12.90</span></section>
    </body></html>`;

    const facts = extractProductFacts(html, PAGE);
    assert.equal(facts.name, 'Contrast Print Regular Fit T-Shirt');
    assert.equal(facts.price, 69.9);
    assert.equal(facts.onSale, false);
    assert.equal(facts.originalPrice, null);
    assert.equal(facts.availability, 'In stock');
    assert.equal(facts.materialSummary, '100% Cotton');
    assert.equal(facts.description, 'Regular fit T-shirt. Crew neck and wide sleeves.');
    assert.deepEqual(facts.images, ['https://cdn.example/main.jpg']);
  });

  it('uses a list price as the current price when no sale price is published', () => {
    const html = `<!doctype html><html><head>
      <script type="application/ld+json">${JSON.stringify({
        '@type': 'Product',
        name: 'Classic Essential Tee',
        description: 'Essential tee in soft cotton with a classic fit.',
        image: 'https://cdn.example/tee.jpg',
        offers: {
          '@type': 'Offer',
          availability: 'http://schema.org/InStock',
          priceSpecification: [{
            '@type': 'UnitPriceSpecification',
            price: 19,
            priceCurrency: 'USD',
            priceType: 'https://schema.org/ListPrice',
          }],
        },
      })}</script>
    </head><body><h1>Classic Essential Tee</h1></body></html>`;

    const facts = extractProductFacts(html, PAGE);
    assert.equal(facts.price, 19);
    assert.equal(facts.onSale, false);
    assert.equal(facts.availability, 'In stock');
    assert.equal(facts.images[0], 'https://cdn.example/tee.jpg');
  });

  it('keeps a compare-at price and the precise sale price', () => {
    const html = `<!doctype html><html><head>
      <script type="application/ld+json">${JSON.stringify({
        '@type': 'ProductGroup',
        name: 'Off Duty T-Shirt',
        description: 'Soft organic cotton tee for rest days.',
        image: ['http://cdn.example/off-duty.jpg'],
        hasVariant: [{
          '@type': 'Product',
          offers: { '@type': 'Offer', price: 21, availability: 'https://schema.org/OutOfStock' },
        }],
      })}</script>
    </head><body>
      <h1>Off Duty T-Shirt</h1>
      <div class="product-price">
        <span>$21.60</span>
        <span class="compare-at-price">$36</span>
      </div>
      <section class="carousel"><span class="price">Sale Price: $38.40 Regular Price: $48</span></section>
    </body></html>`;

    const facts = extractProductFacts(html, PAGE);
    assert.equal(facts.price, 21.6);
    assert.equal(facts.originalPrice, 36);
    assert.equal(facts.onSale, true);
    assert.equal(facts.availability, 'Out of stock');
    assert.equal(facts.images[0], 'https://cdn.example/off-duty.jpg');
    assert.match(facts.description, /organic cotton/i);
  });

  it('finds composition and add-to-cart outside the price element', () => {
    const html = `<!doctype html><html><body>
      <div class="column">
        <div class="title-price"><h1>Contrast Print T-Shirt</h1><div class="money">$ 69.90</div></div>
        <button>Add to cart</button>
        <p>Composition: 100% cotton</p>
      </div>
      <section class="carousel"><span class="price">$12.90</span></section>
    </body></html>`;
    const facts = extractProductFacts(html, PAGE);
    assert.equal(facts.price, 69.9);
    assert.equal(facts.materialSummary, '100% Cotton');
    assert.equal(facts.availability, 'In stock');
  });

  it('reads an add-to-cart label that is glued to the next word', () => {
    const html = `<!doctype html><html><body><h1>Contrast Print T-Shirt</h1><p>$69.90</p><h2>072<span>Add to cart</span>ADD</h2></body></html>`;
    const facts = extractProductFacts(html, PAGE);
    assert.equal(facts.availability, 'In stock');
  });

  it('separates run-on description words and decodes entities', () => {
    const html = `<!doctype html><html><head>
      <script type="application/ld+json">${JSON.stringify({
        '@type': 'Product',
        name: 'Off Duty Tee',
        description: 'RIGHTCasually stylish &amp;amp; simple',
        offers: { '@type': 'Offer', price: '21.60' },
      })}</script>
    </head><body><h1>Off Duty Tee</h1><p>$21.60</p></body></html>`;
    const facts = extractProductFacts(html, PAGE);
    assert.equal(facts.description, 'RIGHT Casually stylish & simple');
  });

  it('reads modified fiber composition from the product description area', () => {
    const html = `<!doctype html><html><head>
      <script type="application/ld+json">${JSON.stringify({
        '@type': 'Product',
        name: 'Relaxed Cotton T-Shirt',
        description: 'A relaxed crew-neck tee.',
        image: 'https://cdn.example/relaxed.jpg',
        offers: { '@type': 'Offer', price: '39.00', availability: 'https://schema.org/InStock' },
      })}</script>
    </head><body>
      <h1>Relaxed Cotton T-Shirt</h1>
      <p>$39.00</p>
      <p>Shell: 100% organic cotton. Machine wash.</p>
    </body></html>`;

    const facts = extractProductFacts(html, PAGE);
    assert.equal(facts.price, 39);
    assert.equal(facts.materialSummary, '100% Organic Cotton');
    assert.equal(facts.availability, 'In stock');
    assert.equal(facts.onSale, false);
  });
});
