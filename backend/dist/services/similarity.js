"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compute_cosine_similarity_1 = __importDefault(require("compute-cosine-similarity"));
class SimilarityScorer {
    constructor() {
        this.WEIGHTS = {
            fabric: 0.4,
            construction: 0.25,
            fit: 0.25,
            care: 0.1
        };
    }
    calculateSimilarity(original, dupe) {
        const breakdown = {
            fabric: this.calculateFabricSimilarity(original.fabricComposition || [], dupe.fabricComposition || []),
            construction: this.calculateConstructionSimilarity(original.construction || [], dupe.construction || []),
            fit: this.calculateFitSimilarity(original.fit || [], dupe.fit || []),
            care: this.calculateCareSimilarity(original.careInstructions || [], dupe.careInstructions || []),
            total: 0
        };
        breakdown.total = Math.round(breakdown.fabric * this.WEIGHTS.fabric +
            breakdown.construction * this.WEIGHTS.construction +
            breakdown.fit * this.WEIGHTS.fit +
            breakdown.care * this.WEIGHTS.care);
        return breakdown;
    }
    calculateFabricSimilarity(original, dupe) {
        if (!original.length || !dupe.length)
            return 0;
        try {
            const allFabrics = Array.from(new Set([...original, ...dupe]));
            const originalVector = this.createFabricVector(original, allFabrics);
            const dupeVector = this.createFabricVector(dupe, allFabrics);
            const similarity = (0, compute_cosine_similarity_1.default)(originalVector, dupeVector);
            if (similarity === null || isNaN(similarity)) {
                return 0;
            }
            return Math.round(similarity * 100);
        }
        catch (error) {
            console.error('Error calculating fabric similarity:', error);
            return 0;
        }
    }
    createFabricVector(fabrics, allFabrics) {
        return allFabrics.map(fabric => fabrics.includes(fabric) ? 1 : 0);
    }
    calculateConstructionSimilarity(original, dupe) {
        if (!original.length || !dupe.length)
            return 0;
        const commonTags = original.filter(tag => dupe.includes(tag));
        return Math.round((commonTags.length / Math.max(original.length, dupe.length)) * 100);
    }
    calculateFitSimilarity(original, dupe) {
        if (!original.length || !dupe.length)
            return 0;
        const commonTags = original.filter(tag => dupe.includes(tag));
        return Math.round((commonTags.length / Math.max(original.length, dupe.length)) * 100);
    }
    calculateCareSimilarity(original, dupe) {
        if (!original.length || !dupe.length)
            return 0;
        const commonTags = original.filter(tag => dupe.includes(tag));
        return Math.round((commonTags.length / Math.max(original.length, dupe.length)) * 100);
    }
}
exports.default = new SimilarityScorer();
//# sourceMappingURL=similarity.js.map