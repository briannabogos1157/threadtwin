import assert from 'assert';
import { describe, it } from 'node:test';
import { extractPercentCompositions, materialSummaryFrom } from './materialSummary';

describe('material summary', () => {
  it('reads a real percentage composition from product copy', () => {
    const text = 'Fabric details100% CottonImported RN: 139864';
    assert.deepEqual(extractPercentCompositions(text), ['100% Cotton']);
    assert.equal(materialSummaryFrom(text, ['cotton']), '100% Cotton');
  });

  it('keeps mixed fiber percentages and drops Material placeholders', () => {
    const text = '50% Cotton, 50% Polyester. Shell: 50% Material';
    assert.equal(
      materialSummaryFrom(text, ['cotton', 'polyester']),
      '50% Cotton, 50% Polyester'
    );
  });

  it('reads fiber-first and modified compositions', () => {
    assert.deepEqual(extractPercentCompositions('Cotton 100%'), ['100% Cotton']);
    assert.equal(materialSummaryFrom('Shell: 100% organic cotton', []), '100% Organic Cotton');
  });

  it('shows the extracted fiber when no percentage is available', () => {
    assert.equal(materialSummaryFrom('soft cotton jersey', ['cotton']), 'Cotton');
  });

  it('does not invent a Material placeholder', () => {
    assert.equal(materialSummaryFrom('50% Material, 50% Material', []), '');
    assert.equal(materialSummaryFrom('', []), '');
  });
});
