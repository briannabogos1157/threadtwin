export interface ProductDetails {
  url: string;
  name: string;
  brand: string;
  price: string;
  description: string;
  fabricComposition: string[];
  careInstructions: string[];
  constructionDetails: string[];
  images: string[];
}

export interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  affiliate_link: string;
  brand?: string;
  name?: string;
  fabric?: string;
  retail_price?: number;
  category?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
} 