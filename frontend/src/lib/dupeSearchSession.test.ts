import assert from 'assert';
import { beforeEach, describe, it } from 'node:test';
import {
  clearDupeSearch,
  dupeSearchIsFinished,
  dupeSearchMessage,
  loadDupeSearch,
  rememberDupeSearch,
  STILL_SEARCHING_AFTER_MS,
} from './dupeSearchSession';

const URL = 'https://www.zara.com/us/en/regular-fit-contrast-print-t-shirt-p06085008.html';
const memory = new Map<string, string>();

describe('dupe search session', () => {
  beforeEach(() => {
    memory.clear();
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
      clear: () => memory.clear(),
      key: () => null,
      length: memory.size,
    } as Storage;
    clearDupeSearch();
  });

  it('remembers a running search for the same product and ignores a different one', () => {
    rememberDupeSearch(URL, 'task-abc12345');
    assert.equal(loadDupeSearch(URL), 'task-abc12345');
    assert.equal(loadDupeSearch('https://www.gymshark.com/products/tee'), null);
  });

  it('describes searching, a long search, results, an empty result, and failure', () => {
    const createdAt = 1_000;
    assert.equal(
      dupeSearchMessage({ status: 'searching', createdAt, now: createdAt + 1_000, resultCount: 0 }),
      'Searching for your twins…'
    );
    assert.equal(
      dupeSearchMessage({
        status: 'searching',
        createdAt,
        now: createdAt + STILL_SEARCHING_AFTER_MS,
        resultCount: 0,
      }),
      'Still searching…'
    );
    assert.equal(
      dupeSearchMessage({ status: 'complete', outcome: 'results', createdAt, now: createdAt, resultCount: 2 }),
      'Results found'
    );
    assert.equal(
      dupeSearchMessage({ status: 'complete', outcome: 'none', createdAt, now: createdAt, resultCount: 0 }),
      'No similar products found'
    );
    assert.equal(
      dupeSearchMessage({ status: 'complete', outcome: 'unusable', createdAt, now: createdAt, resultCount: 0 }),
      'Dupe search could not return results'
    );
    assert.equal(
      dupeSearchMessage({ status: 'unavailable', createdAt, now: createdAt, resultCount: 0 }),
      'Dupe search is temporarily unavailable'
    );
    assert.equal(dupeSearchIsFinished('searching'), false);
    assert.equal(dupeSearchIsFinished('complete'), true);
  });
});
