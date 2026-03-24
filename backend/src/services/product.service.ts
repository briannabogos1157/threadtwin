import { fetchProductsWithManus, isManusConfigured } from './manus.service';
import { Product } from '../types/product';

export class ProductService {
  public static instance: ProductService;

  private productsById = new Map<string, Product>();
  private nextId = 1;

  static initialize(): void {
    console.log('[ProductService] Initializing (Manus, no database)...');
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
  }

  static async getAllProducts(): Promise<Product[]> {
    if (!ProductService.instance) ProductService.initialize();
    return ProductService.instance.getAllProducts();
  }

  static async searchProducts(query: string): Promise<Product[]> {
    if (!ProductService.instance) ProductService.initialize();
    return ProductService.instance.searchProducts(query);
  }

  static async addProduct(_productData: Omit<Product, 'id'>): Promise<Product> {
    if (!ProductService.instance) ProductService.initialize();
    return ProductService.instance.addProduct(_productData);
  }

  static async getProductDetails(productId: string): Promise<Product | null> {
    if (!ProductService.instance) ProductService.initialize();
    return ProductService.instance.getProductDetails(productId);
  }

  private assignIds(rows: Omit<Product, 'id'>[]): Product[] {
    const out: Product[] = [];
    for (const row of rows) {
      const id = String(this.nextId++);
      const p: Product = { ...row, id };
      this.productsById.set(id, p);
      out.push(p);
    }
    return out;
  }

  async getAllProducts(): Promise<Product[]> {
    if (!isManusConfigured()) {
      console.warn('[ProductService] MANUS_API_KEY missing; returning empty product list');
      return [];
    }
    this.productsById.clear();
    this.nextId = 1;
    const rows = await fetchProductsWithManus();
    return this.assignIds(rows);
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!isManusConfigured()) {
      return [];
    }
    const rows = await fetchProductsWithManus(query);
    return this.assignIds(rows);
  }

  async getProductDetails(productId: string): Promise<Product | null> {
    return this.productsById.get(productId) ?? null;
  }

  async addProduct(_productData: Omit<Product, 'id'>): Promise<Product> {
    throw new Error(
      'Product catalog is powered by Manus only; persisted admin add is disabled.'
    );
  }
}
