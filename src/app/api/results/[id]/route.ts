import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Match } from '@/types/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const originalProduct = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        originalMatches: {
          include: {
            similarProduct: true,
          },
        },
      },
    });

    if (!originalProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: originalProduct.id,
        url: originalProduct.url,
        title: originalProduct.title,
        image: originalProduct.image,
        price: originalProduct.price,
        fabric: originalProduct.fabric,
        fit: originalProduct.fit,
        care: originalProduct.care,
        construction: originalProduct.construction,
      },
      similarProducts: originalProduct.originalMatches.map((match: Match) => ({
        product: {
          id: match.similarProduct.id,
          url: match.similarProduct.url,
          title: match.similarProduct.title,
          image: match.similarProduct.image,
          price: match.similarProduct.price,
          fabric: match.similarProduct.fabric,
          fit: match.similarProduct.fit,
          care: match.similarProduct.care,
          construction: match.similarProduct.construction,
        },
        similarity: {
          overall: match.totalScore,
          fabric: match.fabricScore,
          fit: match.fitScore,
          care: match.careScore,
          construction: match.constructionScore,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
} 