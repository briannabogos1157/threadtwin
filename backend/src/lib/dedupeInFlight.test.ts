import assert from 'assert';
import { describe, it } from 'node:test';
import { dedupeInFlight } from './dedupeInFlight';

describe('dedupeInFlight', () => {
  it('runs once when the same key is requested concurrently', async () => {
    const inflight = new Map<string, Promise<string>>();
    let calls = 0;
    const run = () => {
      calls += 1;
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve('ok'), 20);
      });
    };

    const [a, b] = await Promise.all([
      dedupeInFlight(inflight, 'https://shop.example/tee', run),
      dedupeInFlight(inflight, 'https://shop.example/tee', run),
    ]);

    assert.equal(calls, 1);
    assert.equal(a, 'ok');
    assert.equal(b, 'ok');
  });

  it('runs again after the previous analysis settles', async () => {
    const inflight = new Map<string, Promise<number>>();
    let calls = 0;
    const run = async () => {
      calls += 1;
      return calls;
    };

    assert.equal(await dedupeInFlight(inflight, 'same', run), 1);
    assert.equal(await dedupeInFlight(inflight, 'same', run), 2);
    assert.equal(calls, 2);
  });

  it('does not share work across different URLs', async () => {
    const inflight = new Map<string, Promise<string>>();
    const seen: string[] = [];
    const runFor = (url: string) =>
      dedupeInFlight(inflight, url, async () => {
        seen.push(url);
        return url;
      });

    await Promise.all([
      runFor('https://shop.example/a'),
      runFor('https://shop.example/b'),
    ]);

    assert.deepEqual(seen.sort(), ['https://shop.example/a', 'https://shop.example/b']);
  });
});
