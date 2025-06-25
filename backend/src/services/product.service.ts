import axios from 'axios';
import { Product } from '../types/product';

export class ProductService {
  private readonly RETAIL_API_URL = process.env.RETAIL_API_URL || 'https://api.retail.com/v1';
  private readonly RETAIL_API_KEY = process.env.RETAIL_API_KEY;
  private static instance: ProductService;
  private mockProducts: Product[] = [];

  constructor() {
    if (!this.RETAIL_API_KEY) {
      console.warn('Retail API key not found, using mock data');
    }
    // Initialize with some mock products
    this.mockProducts = [
      {
        id: '1',
        title: 'Soft Ribbed Midi Dress',
        description: 'A comfortable and stylish midi dress perfect for any occasion.',
        price: '89.99',
        currency: 'USD',
        brand: 'Zara',
        imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop',
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
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
        productUrl: 'https://www.skims.com/dress',
        tags: ['dress', 'long', 'formal'],
        fabric: '100% Silk'
      },
      {
        id: '3',
        title: 'Classic White T-Shirt',
        description: 'A timeless white t-shirt made from premium cotton.',
        price: '29.99',
        currency: 'USD',
        brand: 'Uniqlo',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
        productUrl: 'https://www.uniqlo.com/tshirt',
        tags: ['tshirt', 'basic', 'casual'],
        fabric: '100% Cotton'
      },
      {
        id: '4',
        title: 'High-Waisted Jeans',
        description: 'Comfortable high-waisted jeans with a modern fit.',
        price: '79.99',
        currency: 'USD',
        brand: 'Levi\'s',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop',
        productUrl: 'https://www.levis.com/jeans',
        tags: ['jeans', 'denim', 'casual'],
        fabric: '98% Cotton, 2% Elastane'
      }
    ];
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
    const searchTerm = query.toLowerCase();
    const filteredProducts = this.mockProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    console.log(`[ProductService] Found ${filteredProducts.length} mock products`);
    return filteredProducts;
  }

  // Add a new product to the mock data
  addProduct(productData: Omit<Product, 'id'>): Product {
    const newId = (this.mockProducts.length + 1).toString();
    const newProduct: Product = {
      id: newId,
      ...productData
    };
    
    this.mockProducts.push(newProduct);
    console.log(`[ProductService] Added new product with ID: ${newId}`);
    return newProduct;
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
        imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop',
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
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
        productUrl: 'https://www.skims.com/dress',
        tags: ['dress', 'long', 'formal'],
        fabric: '100% Silk'
      }
    };

    return mockProducts[productId] || null;
  }
} 