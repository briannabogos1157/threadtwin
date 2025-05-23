'use client';

interface Product {
  url: string;
  title: string;
  image: string;
  price: string;
  fabric: string[];
  fit: string[];
  care: string[];
  construction: string[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden w-full max-w-sm">
      <div className="relative h-64">
        <img
          src={product.image}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg mb-2 line-clamp-2">{product.title}</h3>
        <p className="text-lg font-bold text-blue-600 mb-4">{product.price}</p>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Fabric</h4>
            <p className="text-sm text-gray-600">{product.fabric.join(', ')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Construction</h4>
            <p className="text-sm text-gray-600">{product.construction.join(', ')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Fit</h4>
            <p className="text-sm text-gray-600">{product.fit.join(', ')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Care</h4>
            <p className="text-sm text-gray-600">{product.care.join(', ')}</p>
          </div>
        </div>

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block w-full text-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View Product
        </a>
      </div>
    </div>
  );
} 