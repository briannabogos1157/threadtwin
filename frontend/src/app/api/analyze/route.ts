import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeProduct } from '@/services/scraper';
import { ProductDetails } from '@/types/product';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Analyze product using the scraper service
    const productDetails = await scrapeProduct(url);

    // Store in database
    const savedProduct = await prisma.product.create({
      data: {
        url: productDetails.url,
        name: productDetails.name,
        brand: productDetails.brand,
        price: productDetails.price,
        description: productDetails.description,
        fabricComposition: productDetails.fabricComposition,
        careInstructions: productDetails.careInstructions,
        constructionDetails: productDetails.constructionDetails,
        images: productDetails.images,
      }
    });

    return NextResponse.json(savedProduct);
  } catch (error) {
    console.error('Error analyzing product:', error);
    return NextResponse.json(
      { error: 'Failed to analyze product' },
      { status: 500 }
    );
  }
} 