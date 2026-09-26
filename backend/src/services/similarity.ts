import {
  extractApparel,
  facetSimilarity,
  fiberSimilarity,
  fibersUseBlend,
  type ApparelCategory,
  type FiberAmount,
} from './apparelTerms';

export type MatchStatus = 'matched' | 'partial' | 'mismatch' | 'unavailable';
export type MatchConfidence = 'high' | 'medium' | 'low';

export interface CategoryScore {
  score: number | null;
  status: MatchStatus;
  note: string;
  facets: number;
}

export interface MatchBreakdown {
  fabric: number | null;
  fit: number | null;
  construction: number | null;
  care: number | null;
  total: number;
  fabricStatus: MatchStatus;
  fitStatus: MatchStatus;
  constructionStatus: MatchStatus;
  careStatus: MatchStatus;
  fabricNote: string;
  fitNote: string;
  constructionNote: string;
  careNote: string;
  /** Facets both products actually described, so they could be compared. */
  comparableFacets: number;
  /**
   * Share of the category weights that had enough information to score.
   * This does not change `total`. A fabric-only match can still be 100
   * with low coverage.
   */
  coverage: number;
  confidence: MatchConfidence;
}

interface ProductForComparison {
  name?: string;
  description?: string;
  fabric?: string;
  fabricComposition?: string[];
  materialSummary?: string;
  construction?: string[];
  fit?: string[];
  careInstructions?: string[];
  care?: string[];
}

export const SIMILARITY_WEIGHTS = {
  fabric: 0.4,
  construction: 0.25,
  fit: 0.25,
  care: 0.1,
} as const;

const FIT_FACETS = ['silhouette', 'length', 'sleeve', 'volume', 'rise', 'leg', 'proportion'];
const CONSTRUCTION_FACETS = [
  'neckline', 'knit', 'closure', 'hem', 'seam', 'pocket', 'embellishment', 'graphic', 'structure', 'lining',
];
const CARE_FACETS = ['wash', 'dry', 'iron'];

function statusFor(score: number | null): MatchStatus {
  if (score === null) return 'unavailable';
  if (score >= 80) return 'matched';
  if (score >= 40) return 'partial';
  return 'mismatch';
}

function facetLabel(score: number): string {
  if (score >= 80) return 'match';
  if (score >= 40) return 'partial';
  return 'mismatch';
}

/**
 * High means most of the scoring weight was comparable across at least three facets.
 * Medium means two or more facets covering at least 40% of the weight.
 * A single fiber match is low even when that fiber score is 100.
 */
export function confidenceFor(coverage: number, facets: number): MatchConfidence {
  if (coverage >= 75 && facets >= 3) return 'high';
  if (coverage >= 40 && facets >= 2) return 'medium';
  return 'low';
}

function categoryFromFacets(
  source: Record<string, string[]>,
  candidate: Record<string, string[]>,
  facets: string[]
): CategoryScore {
  const compared: string[] = [];
  const scores: number[] = [];
  for (const facet of facets) {
    const score = facetSimilarity(source[facet] || [], candidate[facet] || []);
    if (score === null) continue;
    scores.push(score);
    compared.push(`${facet} ${facetLabel(score)}`);
  }
  if (!scores.length) {
    return { score: null, status: 'unavailable', note: 'not enough data', facets: 0 };
  }
  const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  return { score, status: statusFor(score), note: compared.join(', '), facets: scores.length };
}

function fabricCategory(sourceFibers: FiberAmount[], candidateFibers: FiberAmount[], sourceMaterial: string[], candidateMaterial: string[]): CategoryScore {
  const compared: string[] = [];
  const scores: number[] = [];
  const fiberScore = fiberSimilarity(sourceFibers, candidateFibers);
  if (fiberScore !== null) {
    scores.push(fiberScore);
    const label = fibersUseBlend(sourceFibers, candidateFibers) ? 'blend' : 'fiber';
    compared.push(`${label} ${facetLabel(fiberScore)}`);
  }
  const materialScore = facetSimilarity(sourceMaterial, candidateMaterial);
  if (materialScore !== null) {
    scores.push(materialScore);
    compared.push(`material ${facetLabel(materialScore)}`);
  }
  if (!scores.length) {
    return { score: null, status: 'unavailable', note: 'not enough data', facets: 0 };
  }
  const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  return { score, status: statusFor(score), note: compared.join(', '), facets: scores.length };
}

function evidenceText(product: ProductForComparison): Array<string | string[] | undefined> {
  return [
    product.name,
    product.description,
    product.materialSummary,
    product.fabric,
    product.fabricComposition,
    product.construction,
    product.fit,
    product.careInstructions,
    product.care,
  ];
}

class SimilarityScorer {
  calculateSimilarity(original: ProductForComparison, dupe: ProductForComparison): MatchBreakdown {
    const source = extractApparel(evidenceText(original));
    const candidate = extractApparel(evidenceText(dupe));
    const fabric = fabricCategory(
      source.fibers,
      candidate.fibers,
      source.facets.fabric.material || [],
      candidate.facets.fabric.material || []
    );
    const fit = categoryFromFacets(source.facets.fit, candidate.facets.fit, FIT_FACETS);
    const construction = categoryFromFacets(
      source.facets.construction,
      candidate.facets.construction,
      CONSTRUCTION_FACETS
    );
    const care = categoryFromFacets(source.facets.care, candidate.facets.care, CARE_FACETS);
    const categories: Record<ApparelCategory, CategoryScore> = { fabric, fit, construction, care };

    let weighted = 0;
    let used = 0;
    let comparableFacets = 0;
    (Object.keys(SIMILARITY_WEIGHTS) as ApparelCategory[]).forEach((key) => {
      const category = categories[key];
      comparableFacets += category.facets;
      if (category.score === null) return;
      weighted += category.score * SIMILARITY_WEIGHTS[key];
      used += SIMILARITY_WEIGHTS[key];
    });
    const coverage = Math.round(used * 100);

    return {
      fabric: fabric.score,
      fit: fit.score,
      construction: construction.score,
      care: care.score,
      total: used === 0 ? 0 : Math.round(weighted / used),
      fabricStatus: fabric.status,
      fitStatus: fit.status,
      constructionStatus: construction.status,
      careStatus: care.status,
      fabricNote: fabric.note,
      fitNote: fit.note,
      constructionNote: construction.note,
      careNote: care.note,
      comparableFacets,
      coverage,
      confidence: confidenceFor(coverage, comparableFacets),
    };
  }
}

export default new SimilarityScorer();
