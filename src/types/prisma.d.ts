import { Product } from '@prisma/client';

export interface Match {
  similarProduct: Product;
  fabricScore: number;
  constructionScore: number;
  fitScore: number;
  careScore: number;
  totalScore: number;
}

export interface ProductWithMatches extends Product {
  originalMatches: Match[];
} 