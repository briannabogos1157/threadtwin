import { prisma } from '../models/product.model';

export class ProductService {
  static async getAllProducts() {
    return prisma.product.findMany({
      include: {
        colors: true,
        badges: true,
        prices: true
      }
    });
  }

  static async addAffiliateProduct(url: string) {
    return prisma.product.create({
      data: {
        title: url, // Placeholder until we implement proper scraping
        description: '',
        price: 0,
        currency: 'USD',
        merchant: new URL(url).hostname,
        productUrl: url
      }
    });
  }

  static async importProducts(products: any[]) {
    return prisma.product.createMany({
      data: products.map(product => ({
        title: product.title,
        description: product.description || '',
        price: parseFloat(product.price) || 0,
        currency: product.currency || 'USD',
        merchant: product.merchant,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl
      }))
    });
  }
} 