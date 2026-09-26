import assert from 'assert';
import { describe, it } from 'node:test';
import { formatMaterialLabel } from './formatMaterialLabel';

describe('formatMaterialLabel', () => {
  it('shows a real percentage composition', () => {
    assert.equal(formatMaterialLabel('100% cotton'), '100% Cotton');
    assert.equal(formatMaterialLabel('50% cotton, 50% polyester'), '50% Cotton, 50% Polyester');
  });

  it('shows the extracted fiber when no percentage exists', () => {
    assert.equal(formatMaterialLabel('cotton'), 'Cotton');
  });

  it('never shows the Material placeholder', () => {
    assert.equal(formatMaterialLabel('50% Material, 50% Material'), '');
    assert.equal(formatMaterialLabel('Material'), '');
    assert.equal(formatMaterialLabel(''), '');
    assert.equal(formatMaterialLabel(undefined), '');
  });
});
