import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { Product } from '../types/product';

const prisma = new PrismaClient();

export class ProductService {
  private readonly RETAIL_API_URL = process.env.RETAIL_API_URL || 'https://api.retail.com/v1';
  private readonly RETAIL_API_KEY = process.env.RETAIL_API_KEY;
  public static instance: ProductService;

  constructor() {
    if (!this.RETAIL_API_KEY) {
      console.warn('Retail API key not found, using database data');
    }
  }

  // Static methods for singleton pattern
  static initialize(): void {
    console.log('[ProductService] Initializing...');
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
  }

  static async getAllProducts(): Promise<Product[]> {
    if (!ProductService.instance) {
      ProductService.initialize();
    }
    return ProductService.instance.getAllProducts();
  }

  static async searchProducts(query: string): Promise<Product[]> {
    if (!ProductService.instance) {
      ProductService.initialize();
    }
    return ProductService.instance.searchProducts(query);
  }

  static async addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    if (!ProductService.instance) {
      ProductService.initialize();
    }
    return ProductService.instance.addProduct(productData);
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      console.log('[ProductService] Fetching all products from database...');
      const dbProducts = await prisma.products.findMany({
        orderBy: { created_at: 'desc' }
      });

      const products: Product[] = dbProducts.map(dbProduct => ({
        id: dbProduct.id.toString(),
        title: dbProduct.title || dbProduct.name,
        description: dbProduct.description || '',
        price: dbProduct.price.toString(),
        currency: 'USD', // Default currency
        brand: dbProduct.brand,
        imageUrl: dbProduct.image_url || dbProduct.image || '',
        productUrl: dbProduct.url,
        tags: dbProduct.category ? [dbProduct.category] : [],
        fabric: dbProduct.fabric || 'Unknown'
      }));

      console.log(`[ProductService] Found ${products.length} products from database`);
      return products;
    } catch (error) {
      console.error('[ProductService] Error fetching products from database:', error);
      return [];
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    console.log('[ProductService] Searching for query:', query);
    
    if (!this.RETAIL_API_KEY) {
      // Use database search if no retail API key
      return this.searchDatabaseProducts(query);
    }

    try {
      const response = await axios.get(`${this.RETAIL_API_URL}/products/search`, {
        params: {
          q: query,
          limit: 20,
          fields: 'id,title,description,price,currency,brand,images,url'
        },
        headers: {
          'Authorization': `Bearer ${this.RETAIL_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      const products = response.data.products.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price.toString(),
        currency: item.currency || 'USD',
        brand: item.brand,
        imageUrl: item.images?.[0]?.url || '',
        productUrl: item.url,
        tags: item.tags || [],
        fabric: item.fabric || 'Unknown'
      }));

      console.log(`[ProductService] Found ${products.length} real products`);
      return products;
    } catch (error) {
      console.error('[ProductService] Error fetching real products:', error);
      // Fallback to database search if API call fails
      return this.searchDatabaseProducts(query);
    }
  }

  async searchDatabaseProducts(query: string): Promise<Product[]> {
    try {
      const searchTerm = query.toLowerCase();
      
      const dbProducts = await prisma.products.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { brand: { contains: searchTerm, mode: 'insensitive' } },
            { category: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        orderBy: { created_at: 'desc' }
      });

      const products: Product[] = dbProducts.map(dbProduct => ({
        id: dbProduct.id.toString(),
        title: dbProduct.title || dbProduct.name,
        description: dbProduct.description || '',
        price: dbProduct.price.toString(),
        currency: 'USD',
        brand: dbProduct.brand,
        imageUrl: dbProduct.image_url || dbProduct.image || '',
        productUrl: dbProduct.url,
        tags: dbProduct.category ? [dbProduct.category] : [],
        fabric: dbProduct.fabric || 'Unknown'
      }));

      console.log(`[ProductService] Found ${products.length} database products`);
      return products;
    } catch (error) {
      console.error('[ProductService] Error searching database products:', error);
      return [];
    }
  }

  // Add a new product to the database
  async addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    try {
      console.log('[ProductService] Adding new product to database:', productData.title);
      
      const newDbProduct = await prisma.products.create({
        data: {
          title: productData.title,
          name: productData.title, // Use title as name for compatibility
          description: productData.description,
          price: parseFloat(productData.price),
          brand: productData.brand,
          image_url: productData.imageUrl,
          image: productData.imageUrl, // Also store in image field for compatibility
          url: productData.productUrl,
          affiliate_link: productData.productUrl, // Use productUrl as affiliate_link
          fabric: productData.fabric,
          category: productData.tags?.[0] || null, // Use first tag as category
          source: 'manual' // Mark as manually added
        }
      });

      const newProduct: Product = {
        id: newDbProduct.id.toString(),
        title: newDbProduct.title || newDbProduct.name,
        description: newDbProduct.description || '',
        price: newDbProduct.price.toString(),
        currency: 'USD',
        brand: newDbProduct.brand,
        imageUrl: newDbProduct.image_url || newDbProduct.image || '',
        productUrl: newDbProduct.url,
        tags: newDbProduct.category ? [newDbProduct.category] : [],
        fabric: newDbProduct.fabric || 'Unknown'
      };

      console.log(`[ProductService] Added new product with ID: ${newProduct.id}`);
      return newProduct;
    } catch (error) {
      console.error('[ProductService] Error adding product to database:', error);
      throw error;
    }
  }

  async getProductDetails(productId: string): Promise<Product | null> {
    try {
      const dbProduct = await prisma.products.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!dbProduct) {
        return null;
      }

      const product: Product = {
        id: dbProduct.id.toString(),
        title: dbProduct.title || dbProduct.name,
        description: dbProduct.description || '',
        price: dbProduct.price.toString(),
        currency: 'USD',
        brand: dbProduct.brand,
        imageUrl: dbProduct.image_url || dbProduct.image || '',
        productUrl: dbProduct.url,
        tags: dbProduct.category ? [dbProduct.category] : [],
        fabric: dbProduct.fabric || 'Unknown'
      };

      return product;
    } catch (error) {
      console.error('[ProductService] Error fetching product details:', error);
      return null;
    }
  }
} 