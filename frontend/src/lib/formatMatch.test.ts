import assert from 'assert';
import { describe, it } from 'node:test';
import { formatMatchCategory, formatMatchCoverage, formatMatchHeadline } from './formatMatch';

describe('formatMatchCategory', () => {
  it('names a match, a partial match, a mismatch, and missing data', () => {
    assert.equal(formatMatchCategory('Fabric', 100, 'matched', 'fiber match'), 'Fabric: 100% match · fiber match');
    assert.equal(formatMatchCategory('Fit', 70, 'partial', 'silhouette partial'), 'Fit: 70% partial match · silhouette partial');
    assert.equal(formatMatchCategory('Construction', 15, 'mismatch'), 'Construction: 15% mismatch');
    assert.equal(formatMatchCategory('Care', null, 'unavailable'), 'Care: not enough data');
  });

  it('shows coverage without replacing the match percent', () => {
    assert.equal(formatMatchHeadline(96, 'high'), '96% match · high coverage');
    assert.equal(formatMatchHeadline(96, 'low'), '96% match · low coverage');
    assert.equal(formatMatchCoverage(1, 40), '1 comparable facet · 40% coverage');
    assert.equal(formatMatchCoverage(5, 90), '5 comparable facets · 90% coverage');
  });
});
