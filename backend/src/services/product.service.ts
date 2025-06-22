import axios from 'axios';
import { Product } from '../types/product';

export class ProductService {
  private readonly RETAIL_API_URL = process.env.RETAIL_API_URL || 'https://api.retail.com/v1';
  private readonly RETAIL_API_KEY = process.env.RETAIL_API_KEY;
  private static instance: ProductService;

  constructor() {
    if (!this.RETAIL_API_KEY) {
      console.warn('Retail API key not found, using mock data');
    }
  }

  // Static methods for singleton pattern
  static initialize(): void {
    console.log('[ProductService] Initializing...');
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
  }

  static getAllProducts(): Product[] {
    if (!ProductService.instance) {
      ProductService.initialize();
    }
    // For now, return mock products. In a real implementation, this would fetch from database
    return ProductService.instance.searchMockProducts('');
  }

  static async searchProducts(query: string): Promise<Product[]> {
    if (!ProductService.instance) {
      ProductService.initialize();
    }
    return ProductService.instance.searchProducts(query);
  }

  async searchProducts(query: string): Promise<Product[]> {
    console.log('[ProductService] Searching for query:', query);
    
    if (!this.RETAIL_API_KEY) {
      // Fallback to mock data if no API key
      return this.searchMockProducts(query);
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
      // Fallback to mock data if API call fails
      return this.searchMockProducts(query);
    }
  }

  searchMockProducts(query: string): Product[] {
    const mockProducts: Product[] = [
      {
        id: '1',
        title: 'Soft Ribbed Midi Dress',
        description: 'A comfortable and stylish midi dress perfect for any occasion.',
        price: '89.99',
        currency: 'USD',
        brand: 'Zara',
        imageUrl: 'https://picsum.photos/400/600?random=1',
        productUrl: 'https://www.zara.com/dress',
        tags: ['dress', 'midi', 'casual'],
        fabric: '95% Cotton, 5% Elastane'
      },
      {
        id: '2',
        title: 'Soft Lounge Long Dress',
        description: 'An elegant long dress for special occasions.',
        price: '129.99',
        currency: 'USD',
        brand: 'SKIMS',
        imageUrl: 'https://picsum.photos/400/600?random=2',
        productUrl: 'https://www.skims.com/dress',
        tags: ['dress', 'long', 'formal'],
        fabric: '100% Silk'
      }
    ];

    const searchTerm = query.toLowerCase();
    const filteredProducts = mockProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    console.log(`[ProductService] Found ${filteredProducts.length} mock products`);
    return filteredProducts;
  }

  async getProductDetails(productId: string): Promise<Product | null> {
    if (!this.RETAIL_API_KEY) {
      // Fallback to mock data if no API key
      return this.getMockProductDetails(productId);
    }

    try {
      const response = await axios.get(`${this.RETAIL_API_URL}/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${this.RETAIL_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      const item = response.data;
      const product: Product = {
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
      };

      return product;
    } catch (error) {
      console.error('[ProductService] Error fetching product details:', error);
      // Fallback to mock data if API call fails
      return this.getMockProductDetails(productId);
    }
  }

  private getMockProductDetails(productId: string): Product | null {
    const mockProducts: Record<string, Product> = {
      '1': {
        id: '1',
        title: 'Soft Ribbed Midi Dress',
        description: 'A comfortable and stylish midi dress perfect for any occasion.',
        price: '89.99',
        currency: 'USD',
        brand: 'Zara',
        imageUrl: 'https://picsum.photos/400/600?random=1',
        productUrl: 'https://www.zara.com/dress',
        tags: ['dress', 'midi', 'casual'],
        fabric: '95% Cotton, 5% Elastane'
      },
      '2': {
        id: '2',
        title: 'Soft Lounge Long Dress',
        description: 'An elegant long dress for special occasions.',
        price: '129.99',
        currency: 'USD',
        brand: 'SKIMS',
        imageUrl: 'https://picsum.photos/400/600?random=2',
        productUrl: 'https://www.skims.com/dress',
        tags: ['dress', 'long', 'formal'],
        fabric: '100% Silk'
      }
    };

    return mockProducts[productId] || null;
  }
} 