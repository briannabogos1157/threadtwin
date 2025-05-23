import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
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

    try {
      // Check if product already exists
      let originalProduct = await prisma.product.findUnique({
        where: { url }
      });

      if (!originalProduct) {
        // In a real app, this would scrape the actual product data
        originalProduct = await prisma.product.create({
          data: {
            url,
            title: 'Original Cotton Sweater',
            image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
            price: '$129.99',
            fabric: ['100% Cotton', 'Medium weight knit'],
            fit: ['Regular fit', 'True to size'],
            care: ['Machine wash cold', 'Tumble dry low'],
            construction: ['Ribbed cuffs', 'Seamless knitting'],
          },
        });
      }

      // Create similar products if they don't exist
      const similar1 = await prisma.product.upsert({
        where: { url: 'https://example.com/similar1' },
        update: {},
        create: {
          url: 'https://example.com/similar1',
          title: 'Essential Cotton Blend Sweater',
          image: 'https://images.unsplash.com/photo-1618225747659-433d5a5c6af7?w=400',
          price: '$89.99',
          fabric: ['90% Cotton', '10% Polyester', 'Medium weight knit'],
          fit: ['Regular fit', 'Runs large'],
          care: ['Machine wash cold', 'Lay flat to dry'],
          construction: ['Ribbed cuffs', 'Traditional knitting'],
        },
      });

      const similar2 = await prisma.product.upsert({
        where: { url: 'https://example.com/similar2' },
        update: {},
        create: {
          url: 'https://example.com/similar2',
          title: 'Organic Cotton Pullover',
          image: 'https://images.unsplash.com/photo-1624206112918-f140f087f9b5?w=400',
          price: '$74.99',
          fabric: ['95% Organic Cotton', '5% Elastane', 'Light weight knit'],
          fit: ['Regular fit', 'True to size'],
          care: ['Machine wash cold', 'Tumble dry low'],
          construction: ['Ribbed cuffs and hem', 'Seamless construction'],
        },
      });

      // Create or update product matches
      await prisma.productMatch.upsert({
        where: {
          originalProductId_similarProductId: {
            originalProductId: originalProduct.id,
            similarProductId: similar1.id,
          },
        },
        update: {},
        create: {
          originalProductId: originalProduct.id,
          similarProductId: similar1.id,
          fabricScore: 85,
          constructionScore: 75,
          fitScore: 90,
          careScore: 80,
          totalScore: 83.5,
        },
      });

      await prisma.productMatch.upsert({
        where: {
          originalProductId_similarProductId: {
            originalProductId: originalProduct.id,
            similarProductId: similar2.id,
          },
        },
        update: {},
        create: {
          originalProductId: originalProduct.id,
          similarProductId: similar2.id,
          fabricScore: 92,
          constructionScore: 85,
          fitScore: 95,
          careScore: 100,
          totalScore: 91.5,
        },
      });

      return NextResponse.json({ id: originalProduct.id });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: 'Product URL already exists' },
            { status: 409 }
          );
        }
      }
      throw error; // Re-throw for general error handling
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 