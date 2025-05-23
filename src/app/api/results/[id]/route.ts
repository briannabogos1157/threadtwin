import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Validate database connection
    try {
      await prisma.$connect();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Fetch the original product with its matches
    const originalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        originalMatches: {
          include: {
            similarProduct: true,
          },
        },
      },
    });

    if (!originalProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Format the response to match the expected structure
    const response = {
      originalProduct: {
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
      similarProducts: originalProduct.originalMatches.map((match) => ({
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
        scores: {
          fabric: match.fabricScore,
          construction: match.constructionScore,
          fit: match.fitScore,
          care: match.careScore,
          total: match.totalScore,
        },
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving results:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Unique constraint violation' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 