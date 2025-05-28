'use client';

interface ProductCardProps {
  matchPercentage: number;
  matchQuality: string;
  price: number;
  imageUrl?: string;
}

export default function ProductCard({ matchPercentage, matchQuality, price, imageUrl }: ProductCardProps) {
  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Product" 
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white px-4 py-2 rounded-full">
          <span className="font-bold">{matchPercentage}%</span>
        </div>
      </div>
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">{matchQuality}</div>
            <div className="text-2xl font-bold mt-1">${price}</div>
          </div>
          <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
} 