import cosineSimilarity from 'compute-cosine-similarity';

interface ProductForComparison {
  fabricComposition: string[];
  construction: string[];
  fit: string[];
  careInstructions: string[];
}

interface MatchBreakdown {
  fabric: number;
  fit: number;
  construction: number;
  care: number;
  total: number;
}

class SimilarityScorer {
  private readonly WEIGHTS = {
    fabric: 0.4,       // 40%
    construction: 0.25, // 25%
    fit: 0.25,         // 25%
    care: 0.1          // 10%
  };

  calculateSimilarity(original: ProductForComparison, dupe: ProductForComparison): MatchBreakdown {
    const breakdown: MatchBreakdown = {
      fabric: this.calculateFabricSimilarity(original.fabricComposition || [], dupe.fabricComposition || []),
      construction: this.calculateConstructionSimilarity(original.construction || [], dupe.construction || []),
      fit: this.calculateFitSimilarity(original.fit || [], dupe.fit || []),
      care: this.calculateCareSimilarity(original.careInstructions || [], dupe.careInstructions || []),
      total: 0
    };

    // Calculate weighted total
    breakdown.total = Math.round(
      breakdown.fabric * this.WEIGHTS.fabric +
      breakdown.construction * this.WEIGHTS.construction +
      breakdown.fit * this.WEIGHTS.fit +
      breakdown.care * this.WEIGHTS.care
    );

    return breakdown;
  }

  private calculateFabricSimilarity(original: string[], dupe: string[]): number {
    if (!original.length || !dupe.length) return 0;

    try {
      // Convert fabric compositions to vectors
      const allFabrics = Array.from(new Set([...original, ...dupe]));
      const originalVector = this.createFabricVector(original, allFabrics);
      const dupeVector = this.createFabricVector(dupe, allFabrics);

      // Calculate cosine similarity with null check
      const similarity = cosineSimilarity(originalVector, dupeVector);
      if (similarity === null || isNaN(similarity)) {
        return 0;
      }
      return Math.round(similarity * 100);
    } catch (error) {
      console.error('Error calculating fabric similarity:', error);
      return 0;
    }
  }

  private createFabricVector(fabrics: string[], allFabrics: string[]): number[] {
    return allFabrics.map(fabric => 
      fabrics.includes(fabric) ? 1 : 0
    );
  }

  private calculateConstructionSimilarity(original: string[], dupe: string[]): number {
    if (!original.length || !dupe.length) return 0;
    
    const commonTags = original.filter(tag => dupe.includes(tag));
    return Math.round((commonTags.length / Math.max(original.length, dupe.length)) * 100);
  }

  private calculateFitSimilarity(original: string[], dupe: string[]): number {
    if (!original.length || !dupe.length) return 0;

    const commonTags = original.filter(tag => dupe.includes(tag));
    return Math.round((commonTags.length / Math.max(original.length, dupe.length)) * 100);
  }

  private calculateCareSimilarity(original: string[], dupe: string[]): number {
    if (!original.length || !dupe.length) return 0;

    const commonTags = original.filter(tag => dupe.includes(tag));
    return Math.round((commonTags.length / Math.max(original.length, dupe.length)) * 100);
  }
}

export default new SimilarityScorer(); 