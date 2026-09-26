export interface DupeSearchInput {
  name: string;
  price: number;
  originalPrice?: number | null;
  onSale?: boolean;
  description?: string;
  url: string;
  fabric?: string;
  fabricComposition?: string[];
  fit?: string[];
  construction?: string[];
  care?: string[];
  productType?: string;
  retailer?: string;
}

const PRODUCT_TYPES: Array<[RegExp, string]> = [
  [/\bt-?shirts?\b|\btees?\b/i, 't-shirt'],
  [/\bhoodies?\b/i, 'hoodie'],
  [/\bsweatshirts?\b/i, 'sweatshirt'],
  [/\bsweaters?\b|\bjumpers?\b/i, 'sweater'],
  [/\bdresses?\b/i, 'dress'],
  [/\bjeans\b/i, 'jeans'],
  [/\btrousers?\b|\bpants\b/i, 'trousers'],
  [/\bskirts?\b/i, 'skirt'],
  [/\bjackets?\b/i, 'jacket'],
  [/\bcoats?\b/i, 'coat'],
  [/\bblouses?\b/i, 'blouse'],
  [/\bshorts\b/i, 'shorts'],
  [/\bsneakers?\b|\bshoes?\b/i, 'shoes'],
];

export function retailerFromUrl(pageUrl: string): string {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function inferProductType(name: string, description = ''): string {
  const text = `${name} ${description}`;
  for (const [pattern, label] of PRODUCT_TYPES) {
    if (pattern.test(text)) return label;
  }
  return '';
}

/** The analyzed product, with nothing the user has to type again. Price is context, not a match boost. */
export function dupeSearchBody(product: DupeSearchInput): { product: DupeSearchInput } {
  const description = product.description ?? '';
  return {
    product: {
      name: product.name,
      productType: product.productType || inferProductType(product.name, description),
      fabric: product.fabric ?? '',
      fabricComposition: product.fabricComposition ?? [],
      fit: product.fit ?? [],
      construction: product.construction ?? [],
      care: product.care ?? [],
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      onSale: product.onSale === true,
      description,
      retailer: product.retailer || retailerFromUrl(product.url),
      url: product.url,
    },
  };
}
