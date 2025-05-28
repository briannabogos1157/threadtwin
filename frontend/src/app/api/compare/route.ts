import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeProduct } from '@/services/scraper';
import { calculateSimilarity } from '@/services/similarity';

export async function POST(request: Request) {
  try {
    const { originalUrl, dupeUrl } = await request.json();

    if (!originalUrl || !dupeUrl) {
      return NextResponse.json(
        { error: 'Both original and dupe URLs are required' },
        { status: 400 }
      );
    }

    // Analyze both products
    const [originalProduct, dupeProduct] = await Promise.all([
      scrapeProduct(originalUrl),
      scrapeProduct(dupeUrl),
    ]);

    // Calculate similarity scores
    const similarityScore = calculateSimilarity(originalProduct, dupeProduct);

    // Store comparison result
    const comparison = await prisma.comparison.create({
      data: {
        originalProductUrl: originalUrl,
        dupeProductUrl: dupeUrl,
        overallScore: similarityScore.overall.toString(),
        fabricScore: similarityScore.fabric.toString(),
        constructionScore: similarityScore.construction.toString(),
        careScore: similarityScore.care.toString(),
      },
    });

    return NextResponse.json({
      comparison,
      originalProduct,
      dupeProduct,
      similarityScore,
    });
  } catch (error) {
    console.error('Error comparing products:', error);
    return NextResponse.json(
      { error: 'Failed to compare products' },
      { status: 500 }
    );
  }
} 