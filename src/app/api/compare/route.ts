import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import NodeCache from 'node-cache';
import scraper from '@/services/scraper';
import similarityScorer from '@/services/similarity';
import { prisma } from '@/lib/prisma';
import { ProductDetails } from '@/types/product';

const cache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120,
  useClones: false
});

// Validate URL helper
const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

export async function POST(request: Request) {
  try {
    const { originalUrl, dupeUrl } = await request.json();
    
    if (!originalUrl || !dupeUrl) {
      return NextResponse.json(
        { error: 'Both URLs are required' },
        { status: 400 }
      );
    }

    if (!validateUrl(originalUrl) || !validateUrl(dupeUrl)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check cache for comparison
    const cacheKey = `${originalUrl}:${dupeUrl}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log('Cache hit for comparison:', cacheKey);
      return NextResponse.json(cachedResult);
    }

    // Check database for existing comparison
    const existingMatch = await prisma.productMatch.findFirst({
      where: {
        originalProduct: { url: originalUrl },
        dupeProduct: { url: dupeUrl }
      },
      include: {
        originalProduct: true,
        dupeProduct: true
      }
    });

    if (existingMatch) {
      const result = {
        original: existingMatch.originalProduct,
        dupe: existingMatch.dupeProduct,
        matchBreakdown: {
          fabricScore: existingMatch.fabricScore,
          fitScore: existingMatch.fitScore,
          careScore: existingMatch.careScore,
          constructionScore: existingMatch.constructionScore,
          total: existingMatch.totalScore
        }
      };
      cache.set(cacheKey, result);
      return NextResponse.json(result);
    }

    console.log('Comparing products:', { originalUrl, dupeUrl });
    
    // Get or create products
    const [original, dupe] = await Promise.all([
      getOrCreateProduct(originalUrl),
      getOrCreateProduct(dupeUrl)
    ]);

    if (!original || !dupe) {
      return NextResponse.json(
        { error: 'Could not find or create product details for one or both items' },
        { status: 404 }
      );
    }

    // Calculate similarity
    const matchBreakdown = similarityScorer.calculateSimilarity(original, dupe);

    // Store match in database
    const savedMatch = await prisma.productMatch.create({
      data: {
        originalProductId: original.id,
        dupeProductId: dupe.id,
        fabricScore: matchBreakdown.fabricScore,
        fitScore: matchBreakdown.fitScore,
        careScore: matchBreakdown.careScore,
        constructionScore: matchBreakdown.constructionScore,
        totalScore: matchBreakdown.total
      },
      include: {
        originalProduct: true,
        dupeProduct: true
      }
    });

    const result = {
      original,
      dupe,
      matchBreakdown
    };

    // Store in cache
    cache.set(cacheKey, result);
    console.log('Comparison complete:', {
      original: original.name,
      dupe: dupe.name,
      totalMatch: matchBreakdown.total
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error comparing products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOrCreateProduct(url: string) {
  // Check if product exists
  let product = await prisma.product.findUnique({ where: { url } });
  
  if (!product) {
    const productDetails = await scraper.scrapeProduct(url) as ProductDetails;
    
    product = await prisma.product.create({
      data: {
        url: productDetails.url || '',
        name: productDetails.name || '',
        price: productDetails.price || '',
        image: productDetails.image || '',
        fabric: productDetails.fabric || [],
        fit: productDetails.fit || [],
        care: productDetails.care || [],
        construction: productDetails.construction || [],
      }
    });
  }

  return product;
} 