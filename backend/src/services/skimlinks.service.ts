import { getSkimlinksHeaders, SKIMLINKS_CONFIG, validateSkimlinksConfig } from '../utils/skimlinks';

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
      // First validate config
      validateSkimlinksConfig();
      
      console.log('Attempting to validate Skimlinks credentials...');
      const response = await fetch(`${this.baseUrl}/publisher/${SKIMLINKS_CONFIG.publisherId}`, {
        headers: getSkimlinksHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Skimlinks validation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to validate Skimlinks credentials: ${response.statusText}`);
      }

      console.log('Skimlinks credentials validated successfully');
      return true;
    } catch (error) {
      console.error('Skimlinks validation error:', error);
      throw error;
    }
  }

  static async generateAffiliateLink(merchantUrl: string): Promise<string> {
    try {
      console.log('Generating affiliate link for:', merchantUrl);
      const response = await fetch(`${this.baseUrl}/links`, {
        method: 'POST',
        headers: getSkimlinksHeaders(),
        body: JSON.stringify({
          url: merchantUrl,
          publisher_id: SKIMLINKS_CONFIG.publisherId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to generate affiliate link:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to generate affiliate link: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Successfully generated affiliate link');
      return data.skimlinks_url;
    } catch (error) {
      console.error('Error generating affiliate link:', error);
      throw error;
    }
  }

  static async getProductByUrl(url: string): Promise<ProductSearchResult> {
    try {
      console.log('Getting affiliate link for direct URL:', url);
      const affiliateUrl = await this.generateAffiliateLink(url);
      
      // For direct URLs, we create a basic product result
      return {
        id: url, // Using URL as ID since we don't have a product ID
        title: 'Direct Product Link',
        description: 'Product from direct URL',
        price: 0, // We don't have price information for direct URLs
        currency: 'USD',
        merchant: new URL(url).hostname,
        imageUrl: '', // No image available for direct URLs
        productUrl: url,
        affiliateUrl
      };
    } catch (error) {
      console.error('Error processing direct URL:', error);
      throw error;
    }
  }

  static async searchProducts(query: string, limit: number = 20): Promise<ProductSearchResult[]> {
    try {
      // Check if the query is a URL
      const isUrl = query.startsWith('http://') || query.startsWith('https://');
      
      if (isUrl) {
        console.log('Processing direct URL:', query);
        const product = await this.getProductByUrl(query);
        return [product];
      }

      // If not a URL, proceed with regular search
      console.log('Searching products with query:', query);
      const searchUrl = `${this.baseUrl}/products/search?q=${encodeURIComponent(query)}&limit=${limit}&publisher_id=${SKIMLINKS_CONFIG.publisherId}`;
      console.log('Search URL:', searchUrl);

      const response = await fetch(searchUrl, {
        headers: getSkimlinksHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Product search failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to search products: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Found ${data.products?.length || 0} products in search results`);
      
      if (!data.products || !Array.isArray(data.products)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from Skimlinks API');
      }
      
      // Transform the response into our ProductSearchResult format
      return Promise.all(data.products.map(async (product: any) => {
        try {
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
        } catch (error) {
          console.error('Error processing product:', error);
          throw error;
        }
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
} 