import { Product } from '../types/product';

function backendBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3002'
  );
}

interface ApiProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  brand: string;
  imageUrl: string;
  productUrl: string;
  affiliateLink: string;
  fabric?: string;
}

function mapToProduct(p: ApiProduct): Product {
  const priceNum = parseFloat(p.price);
  return {
    id: Number(p.id),
    title: p.title,
    price: Number.isFinite(priceNum) ? priceNum : 0,
    image_url: p.imageUrl,
    affiliate_link: p.affiliateLink || p.productUrl,
    brand: p.brand,
    name: p.title,
    description: p.description,
    fabric: p.fabric,
  };
}

export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      if (typeof window === 'undefined') {
        return [];
      }

      const res = await fetch(`${backendBaseUrl()}/api/products`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Products request failed: ${res.status}`);
      }
      const data: ApiProduct[] = await res.json();
      return Array.isArray(data) ? data.map(mapToProduct) : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async getProductById(id: number): Promise<Product | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const res = await fetch(`${backendBaseUrl()}/api/products/${id}`, {
        cache: 'no-store',
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new Error(`Product request failed: ${res.status}`);
      }
      const data: ApiProduct = await res.json();
      return mapToProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },
};
