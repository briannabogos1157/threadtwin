'use client';

interface ProductCardProps {
  matchPercentage: number;
  matchQuality: string;
  price: number;
  imageUrl?: string;
}

export default function ProductCard({ matchPercentage, matchQuality, price, imageUrl }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="aspect-square bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-2xl font-bold mb-1">{matchPercentage}% match</div>
        <div className="text-gray-600 mb-2">{matchQuality}</div>
        <div className="text-xl font-semibold">${price}</div>
      </div>
    </div>
  );
} 