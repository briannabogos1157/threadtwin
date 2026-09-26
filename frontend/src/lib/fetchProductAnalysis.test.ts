import assert from 'assert';
import { afterEach, describe, it } from 'node:test';
import { fetchProductAnalysis, resetProductAnalysisDedupe } from './fetchProductAnalysis';

const TEE = 'https://www.uniqlo.com/us/en/products/E444527-000/00';
const OTHER = 'https://www.uniqlo.com/us/en/products/E465759-000/00';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchProductAnalysis', () => {
  afterEach(() => {
    resetProductAnalysisDedupe();
  });

  it('sends one request when the product page asks twice for the same URL', async () => {
    let calls = 0;
    const fetchImpl = async (input: string) => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 30));
      return jsonResponse({
        name: 'Supima Cotton Tee',
        price: 19.9,
        description: 'cotton',
        imageUrl: '',
        url: input,
        fabric: '100% Cotton',
      });
    };

    const [first, second] = await Promise.all([
      fetchProductAnalysis(TEE, fetchImpl),
      fetchProductAnalysis(TEE, fetchImpl),
    ]);

    assert.equal(calls, 1);
    assert.equal(first.ok && second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.product.name, 'Supima Cotton Tee');
      assert.equal(second.product.fabric, '100% Cotton');
    }
  });

  it('analyzes again after the first request finishes', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return jsonResponse({ name: 'Tee', price: 19.9, fabric: 'Cotton' });
    };

    await fetchProductAnalysis(TEE, fetchImpl);
    await fetchProductAnalysis(TEE, fetchImpl);
    assert.equal(calls, 2);
  });

  it('analyzes a different product URL separately', async () => {
    const seen: string[] = [];
    const fetchImpl = async (input: string) => {
      seen.push(input);
      return jsonResponse({ name: 'Tee', price: 10, fabric: 'Cotton' });
    };

    await Promise.all([
      fetchProductAnalysis(TEE, fetchImpl),
      fetchProductAnalysis(OTHER, fetchImpl),
    ]);

    assert.equal(seen.length, 2);
    assert.ok(seen.some((url) => url.includes(encodeURIComponent(TEE))));
    assert.ok(seen.some((url) => url.includes(encodeURIComponent(OTHER))));
  });
});
