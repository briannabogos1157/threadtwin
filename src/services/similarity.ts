interface ProductDetails {
  name: string;
  price: string;
  image: string;
  fabric: string[];
  fit: string[];
  care: string[];
  construction: string[];
}

interface MatchBreakdown {
  fabricScore: number;
  fitScore: number;
  careScore: number;
  constructionScore: number;
  total: number;
}

function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0;

  const matches = arr1.filter(item1 => 
    arr2.some(item2 => 
      item2.toLowerCase().includes(item1.toLowerCase()) || 
      item1.toLowerCase().includes(item2.toLowerCase())
    )
  ).length;

  return (matches / Math.max(arr1.length, arr2.length)) * 100;
}

function calculateSimilarity(original: ProductDetails, dupe: ProductDetails): MatchBreakdown {
  const fabricScore = calculateArraySimilarity(original.fabric, dupe.fabric);
  const fitScore = calculateArraySimilarity(original.fit, dupe.fit);
  const careScore = calculateArraySimilarity(original.care, dupe.care);
  const constructionScore = calculateArraySimilarity(original.construction, dupe.construction);

  const total = (fabricScore + fitScore + careScore + constructionScore) / 4;

  return {
    fabricScore,
    fitScore,
    careScore,
    constructionScore,
    total
  };
}

export default {
  calculateSimilarity
}; 