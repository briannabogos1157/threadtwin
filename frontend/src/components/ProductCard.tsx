'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '../types/Product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg">
      {/* Image container with aspect ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
        {!imageError ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 p-4">
            <span className="text-center text-sm text-gray-500">
              {product.brand} - {product.title}
            </span>
          </div>
        )}
      </div>

      {/* Product details */}
      <div className="p-4">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 line-clamp-1">
          {product.title}
        </h3>
        
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {product.brand || 'Brand'}
          </span>
          <div className="flex items-center gap-2">
            {product.retail_price && product.retail_price > product.price && (
              <span className="text-sm text-gray-400 line-through">
                ${product.retail_price.toFixed(2)}
              </span>
            )}
            <span className="font-medium text-primary">
              ${product.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Shop button */}
        <a
          href={product.affiliate_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Shop Now
        </a>
      </div>
    </div>
  );
}; 