import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db"
    }
  }
});

export class ProductService {
  static async getAllProducts() {
    try {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Parse JSON strings back to arrays
      return products.map(product => ({
        ...product,
        fabric: JSON.parse(product.fabric || '[]'),
        fit: JSON.parse(product.fit || '[]'),
        care: JSON.parse(product.care || '[]'),
        construction: JSON.parse(product.construction || '[]')
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async addAffiliateProduct(url: string) {
    try {
      // Extract basic product info from URL
      const urlObj = new URL(url);
      const merchant = urlObj.hostname.replace('www.', '');
      
      // Create or update the product in the database
      const product = await prisma.product.upsert({
        where: {
          url // Use URL as unique identifier
        },
        update: {
          name: `Product from ${merchant}`,
          price: "0", // Price will be updated later through scraping
          image: "", // Image will be updated later through scraping
          fabric: '[]',
          fit: '[]',
          care: '[]',
          construction: '[]',
          updatedAt: new Date()
        },
        create: {
          url,
          name: `Product from ${merchant}`,
          price: "0",
          image: "",
          fabric: '[]',
          fit: '[]',
          care: '[]',
          construction: '[]',
        }
      });

      // Parse JSON strings back to arrays for the response
      return {
        ...product,
        fabric: JSON.parse(product.fabric),
        fit: JSON.parse(product.fit),
        care: JSON.parse(product.care),
        construction: JSON.parse(product.construction),
        affiliateUrl: url
      };
    } catch (error) {
      console.error('Error adding affiliate product:', error);
      throw error;
    }
  }

  static async getProductByUrl(url: string) {
    const product = await prisma.product.findUnique({
      where: { url }
    });

    if (!product) return null;

    // Parse JSON strings back to arrays
    return {
      ...product,
      fabric: JSON.parse(product.fabric),
      fit: JSON.parse(product.fit),
      care: JSON.parse(product.care),
      construction: JSON.parse(product.construction)
    };
  }
} 