import assert from 'assert';
import { describe, it } from 'node:test';
import { conceptSimilarity, extractApparel } from './apparelTerms';
import similarity, { SIMILARITY_WEIGHTS } from './similarity';

const ZARA = {
  name: 'CONTRAST PRINT REGULAR FIT T-SHIRT',
  fabric: '100% Cotton',
  fabricComposition: ['cotton'],
  fit: ['regular', 'wide'],
  construction: [] as string[],
  care: [] as string[],
  description: 'Regular fit T-shirt. Crew neck and wide sleeves falling below the elbow. Featuring contrasting graphic prints on the front and sleeves.',
};

const RETURNED = [
  {
    name: 'Pink Cinnamon Roll Graphic Relaxed Boxy Elbow Length Crew Neck T-Shirt',
    fabric: '100% Cotton',
    fit: ['Relaxed boxy'],
    construction: ['crew neck', 'elbow-length sleeves', 'graphic print'],
    care: ['machine washable'],
  },
  {
    name: 'Ecru Beaded Matcha Graphic Boxy Elbow Sleeve Crew Neck T-Shirt',
    fabric: '100% Cotton',
    fit: ['Relaxed boxy'],
    construction: ['boxy silhouette', 'elbow-length sleeves', 'beaded graphic', 'crew neck'],
    care: ['machine washable'],
  },
  {
    name: 'ASOS DESIGN oversized t-shirt with city graphic in khaki',
    fabric: '100% Cotton',
    fit: ['Oversized'],
    construction: ['crew neck', 'short sleeves', 'city graphic print'],
    care: [] as string[],
  },
];

describe('apparel similarity', () => {
  it('treats related apparel wording as the same concept family', () => {
    assert.equal(conceptSimilarity('regular', 'relaxed'), 75);
    assert.equal(conceptSimilarity('jersey', 'knit'), 80);
    assert.equal(conceptSimilarity('crew', 'bound-crew'), 80);
    assert.equal(conceptSimilarity('graphic', 'contrast-print'), 70);
    assert.equal(conceptSimilarity('machine-wash', 'machine-wash'), 100);
    assert.equal(conceptSimilarity('silk', 'polyester'), 0);
    assert.ok(conceptSimilarity('slim', 'oversized') < 40);
    assert.ok(conceptSimilarity('skinny-leg', 'wide-leg') < 40);
    assert.ok(conceptSimilarity('cardigan', 'pullover') < 40);
    assert.ok(conceptSimilarity('structured', 'unstructured') < 40);

    const wash = extractApparel(['machine washable']);
    const cold = extractApparel(['machine wash cold']);
    assert.deepEqual(wash.facets.care.wash, ['machine-wash']);
    assert.deepEqual(cold.facets.care.wash, ['machine-wash']);

    const elbow = extractApparel(['sleeves falling below the elbow']);
    const elbowLength = extractApparel(['elbow length']);
    assert.deepEqual(elbow.facets.fit.sleeve, ['elbow-sleeve']);
    assert.deepEqual(elbowLength.facets.fit.sleeve, ['elbow-sleeve']);
    assert.equal(elbow.facets.construction.sleeve, undefined);

    const crew = extractApparel(['crewneck']);
    assert.deepEqual(crew.facets.construction.neckline, ['crew']);
    assert.equal(crew.facets.fit.neckline, undefined);
    assert.deepEqual(extractApparel(['round neckline']).facets.construction.neckline, ['crew']);
    assert.deepEqual(extractApparel(['82% polyester 11% polyamide']).fabric, ['polyester', 'nylon']);
    assert.deepEqual(extractApparel(['floral print']).facets.construction.graphic, ['floral-print']);
    assert.deepEqual(extractApparel(['thin straps']).facets.fit.sleeve, ['sleeveless']);
    assert.deepEqual(extractApparel(['knit jumper']).facets.construction.closure, ['pullover']);
    const wool = extractApparel(['66% nylon, 30% merino wool, 4% elastane']);
    assert.deepEqual(wool.fibers.find((fiber) => fiber.id === 'wool'), { id: 'wool', percent: 30 });
    assert.deepEqual(extractApparel(['roll neck cardigan']).facets.construction.neckline, ['mock-neck']);
  });

  it('keeps sleeve length in fit and neckline in construction', () => {
    const scored = similarity.calculateSimilarity(
      { description: 'Regular fit crew neck short sleeve tee', fabric: '100% cotton' },
      { description: 'Oversized crew neck short sleeve tee', fabric: '100% cotton' }
    );
    assert.ok((scored.fit || 0) < 80);
    assert.ok((scored.fit || 0) > 50);
    assert.equal(scored.fitNote.includes('neckline'), false);
    assert.equal(scored.fitNote.includes('sleeve'), true);
    assert.equal(scored.construction, 100);
    assert.equal(scored.constructionNote.includes('neckline'), true);
    assert.equal(scored.constructionNote.includes('sleeve'), false);
  });

  it('does not treat a wide leg as a wide sleeve or a skinny jean as a slim tee', () => {
    const wide = extractApparel(['high rise wide leg jeans']);
    assert.deepEqual(wide.facets.fit.leg, ['wide-leg']);
    assert.equal(wide.facets.fit.volume, undefined);
    assert.deepEqual(wide.facets.fit.rise, ['high-rise']);

    const skinny = extractApparel(['skinny jeans']);
    assert.deepEqual(skinny.facets.fit.leg, ['skinny-leg']);
    assert.equal(skinny.facets.fit.silhouette, undefined);

    const jeans = similarity.calculateSimilarity(
      { name: 'High-rise wide-leg jeans', fabric: '100% cotton', description: 'Wide leg high rise denim' },
      { name: 'High-rise skinny jeans', fabric: '99% cotton 1% elastane', description: 'Skinny high rise denim' }
    );
    assert.ok((jeans.fit || 0) < 70);
    assert.equal(jeans.fitNote.includes('leg'), true);
    assert.ok((jeans.fabric || 0) > 80);
  });

  it('separates silk from polyester satin and a cardigan from a pullover', () => {
    const dress = similarity.calculateSimilarity(
      { name: 'Silk satin midi dress', fabric: '100% silk', description: 'Silk satin midi dress. Dry clean only.' },
      { name: 'Polyester satin midi dress', fabric: '97% polyester 3% elastane', description: 'Polyester satin midi dress. Machine washable.' }
    );
    assert.ok((dress.fabric || 0) <= 50);
    assert.ok((dress.fabric || 0) < 80);
    assert.equal(dress.fabricNote.includes('material'), true);
    assert.ok((dress.care || 0) < 40);

    const knitwear = similarity.calculateSimilarity(
      { name: 'Wool cardigan', fabric: '100% wool', description: 'Button front knit cardigan' },
      { name: 'Wool pullover', fabric: '100% wool', description: 'Crew neck knit pullover' }
    );
    assert.ok((knitwear.construction || 0) < 80);
    assert.equal(knitwear.constructionNote.includes('closure'), true);
    assert.equal(knitwear.fabric, 100);

    const tailoring = similarity.calculateSimilarity(
      { name: 'Tailored blazer', fabric: '100% polyester', description: 'Structured tailored blazer with a notched lapel, single-breasted, fully lined' },
      { name: 'Casual jacket', fabric: '100% polyester', description: 'Unstructured jacket with a collar, buttoned, unlined' }
    );
    assert.ok((tailoring.construction || 0) < 80);
    assert.equal(tailoring.constructionNote.includes('structure'), true);
    assert.equal(tailoring.fabric, 100);
  });

  it('gives partial fit credit and ignores categories the source does not describe', () => {
    const [pink, ecru, asos] = RETURNED.map((product) => similarity.calculateSimilarity(ZARA, {
      ...product,
      careInstructions: product.care,
    }));

    assert.equal(pink.careStatus, 'unavailable');
    assert.equal(ecru.careStatus, 'unavailable');
    assert.equal(asos.careStatus, 'unavailable');
    assert.equal(pink.fabric, 100);
    assert.ok((pink.fit || 0) > 40);
    assert.ok((pink.construction || 0) > 40);
    assert.ok((pink.total || 0) > 40);
    assert.ok((asos.fit || 0) < (pink.fit || 0));
    assert.notEqual(pink.total, asos.total);
    assert.equal(pink.confidence, 'high');
    assert.ok(pink.comparableFacets >= 3);
    assert.ok(pink.coverage >= 75);

    const fabricOnly = similarity.calculateSimilarity(
      { fabricComposition: ['cotton'] },
      { fabricComposition: ['cotton'], careInstructions: ['machine wash'] }
    );
    assert.equal(fabricOnly.fabric, 100);
    assert.equal(fabricOnly.careStatus, 'unavailable');
    assert.equal(fabricOnly.total, 100);
    assert.equal(fabricOnly.coverage, 40);
    assert.equal(fabricOnly.comparableFacets, 1);
    assert.equal(fabricOnly.confidence, 'low');
    assert.equal(SIMILARITY_WEIGHTS.fabric, 0.4);
  });

  it('does not use price or coverage to change a full match', () => {
    const shared = {
      fabric: '100% cotton',
      fit: ['regular'],
      construction: ['knit'],
      careInstructions: ['machine wash'],
      description: 'Regular cotton knit tee',
    };
    const low = similarity.calculateSimilarity(shared, { ...shared, description: `${shared.description} $18` });
    const high = similarity.calculateSimilarity(shared, { ...shared, description: `${shared.description} $70` });
    assert.deepEqual(low, high);
    assert.equal(low.fabricStatus, 'matched');
    assert.equal(low.careStatus, 'matched');
    assert.equal(low.total, 100);
    assert.equal(low.confidence, 'high');
    assert.ok(low.coverage >= 75);
  });
});
