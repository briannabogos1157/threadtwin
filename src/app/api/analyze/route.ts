import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import NodeCache from 'node-cache';
import scraper from '@/services/scraper';
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
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!validateUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedResult = cache.get(url);
    if (cachedResult) {
      console.log('Cache hit for URL:', url);
      return NextResponse.json(cachedResult);
    }

    // Check database
    const existingProduct = await prisma.product.findUnique({
      where: { url }
    });

    if (existingProduct) {
      cache.set(url, existingProduct);
      return NextResponse.json(existingProduct);
    }

    console.log('Analyzing product:', url);
    
    const productDetails = await scraper.scrapeProduct(url) as ProductDetails;
      
    if (!productDetails.name) {
      return NextResponse.json(
        { error: 'Could not find product details' },
        { status: 404 }
      );
    }
    
    // Store in database
    const savedProduct = await prisma.product.create({
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

    // Store in cache
    cache.set(url, savedProduct);
    console.log('Product analysis complete:', savedProduct.name);
    
    return NextResponse.json(savedProduct);
  } catch (error) {
    console.error('Error analyzing product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 