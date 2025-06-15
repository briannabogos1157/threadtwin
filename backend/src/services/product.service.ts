import { v4 as uuidv4 } from 'uuid';

interface Product {
  id: string;
  title: string;
  brand: string;
  fabric: string;
  price: string;
  tags: string[];
  description: string;
  imageUrl: string;
}

export class ProductService {
  private static mockProducts: Product[] = [];

  static initialize() {
    // Initialize with mock products
    if (this.mockProducts.length === 0) {
      this.mockProducts = this.getFallbackProducts();
    }
  }

  private static getFallbackProducts(): Product[] {
    return [
      {
        id: uuidv4(),
        title: "Soft Ribbed Midi Dress",
        brand: "Zara",
        fabric: "92% Cotton, 8% Elastane",
        price: "39.99",
        tags: ["minimal", "lounge", "dupe"],
        description: "A comfortable ribbed midi dress perfect for everyday wear",
        imageUrl: "https://picsum.photos/400/600?random=1"
      },
      {
        id: uuidv4(),
        title: "Classic Denim Jacket",
        brand: "H&M",
        fabric: "100% Cotton Denim",
        price: "49.99",
        tags: ["casual", "denim", "outerwear"],
        description: "A timeless denim jacket with a relaxed fit and classic details",
        imageUrl: "https://picsum.photos/400/600?random=2"
      },
      {
        id: uuidv4(),
        title: "High-Waist Leggings",
        brand: "ASOS",
        fabric: "75% Polyester, 25% Spandex",
        price: "29.99",
        tags: ["athleisure", "workout", "basics"],
        description: "Comfortable high-waisted leggings perfect for workout or casual wear",
        imageUrl: "https://picsum.photos/400/600?random=3"
      },
      {
        id: uuidv4(),
        title: "Oversized Knit Sweater",
        brand: "Zara",
        fabric: "60% Wool, 40% Acrylic",
        price: "59.99",
        tags: ["cozy", "winter", "knitwear"],
        description: "A chunky knit sweater with dropped shoulders and ribbed details",
        imageUrl: "https://picsum.photos/400/600?random=4"
      },
      {
        id: uuidv4(),
        title: "Pleated Mini Skirt",
        brand: "H&M",
        fabric: "100% Polyester",
        price: "34.99",
        tags: ["preppy", "feminine", "mini"],
        description: "A playful pleated mini skirt with an elastic waistband",
        imageUrl: "https://picsum.photos/400/600?random=5"
      },
      {
        id: uuidv4(),
        title: "Soft Lounge Long Dress",
        brand: "SKIMS",
        fabric: "95% Modal, 5% Spandex",
        price: "88.00",
        tags: ["loungewear", "comfortable", "luxury"],
        description: "Ultra-soft long dress perfect for lounging and everyday wear",
        imageUrl: "https://picsum.photos/400/600?random=6"
      },
      {
        id: uuidv4(),
        title: "Cotton Blend T-Shirt",
        brand: "H&M",
        fabric: "60% Cotton, 40% Polyester",
        price: "12.99",
        tags: ["basic", "casual", "essential"],
        description: "A soft and comfortable t-shirt for everyday wear",
        imageUrl: "https://picsum.photos/400/600?random=7"
      },
      {
        id: uuidv4(),
        title: "Wide-Leg Trousers",
        brand: "Zara",
        fabric: "65% Polyester, 35% Viscose",
        price: "49.99",
        tags: ["office", "formal", "elegant"],
        description: "Elegant wide-leg trousers with a high waist and flowing silhouette",
        imageUrl: "https://picsum.photos/400/600?random=8"
      }
    ];
  }

  static async searchProducts(query: string): Promise<Product[]> {
    // Simple search implementation based on text matching
    const searchTerms = query.toLowerCase().split(' ');
    return this.mockProducts.filter(product => {
      const productText = `${product.title} ${product.description} ${product.tags.join(' ')} ${product.brand}`.toLowerCase();
      return searchTerms.some(term => productText.includes(term));
    });
  }

  static getAllProducts(): Product[] {
    return this.mockProducts;
  }
} 