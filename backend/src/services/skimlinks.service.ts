import { getSkimlinksHeaders, SKIMLINKS_CONFIG } from '../utils/skimlinks';

export interface ProductSearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  merchant: string;
  imageUrl: string;
  productUrl: string;
  affiliateUrl: string;
}

export class SkimlinksService {
  private static baseUrl = 'https://api-v2.skimlinks.com';

  static async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/publisher/${SKIMLINKS_CONFIG.publisherId}`, {
        headers: getSkimlinksHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to validate Skimlinks credentials');
      }

      return true;
    } catch (error) {
      console.error('Skimlinks validation error:', error);
      throw error;
    }
  }

  static async generateAffiliateLink(merchantUrl: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/links`, {
        method: 'POST',
        headers: getSkimlinksHeaders(),
        body: JSON.stringify({
          url: merchantUrl,
          publisher_id: SKIMLINKS_CONFIG.publisherId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate affiliate link');
      }

      const data = await response.json();
      return data.skimlinks_url;
    } catch (error) {
      console.error('Error generating affiliate link:', error);
      throw error;
    }
  }

  static async searchProducts(query: string, limit: number = 20): Promise<ProductSearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/products/search?q=${encodeURIComponent(query)}&limit=${limit}&publisher_id=${SKIMLINKS_CONFIG.publisherId}`, {
        headers: getSkimlinksHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      const data = await response.json();
      
      // Transform the response into our ProductSearchResult format
      return data.products.map(async (product: any) => {
        const affiliateUrl = await this.generateAffiliateLink(product.url);
        
        return {
          id: product.id,
          title: product.name,
          description: product.description,
          price: product.price,
          currency: product.currency,
          merchant: product.merchant_name,
          imageUrl: product.image_url,
          productUrl: product.url,
          affiliateUrl
        };
      });
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
} 