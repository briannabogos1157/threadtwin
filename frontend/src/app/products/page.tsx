'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '../../types/Product';
import { productService } from '../../services/productService';
import { ProductGrid } from '../../components/ProductGrid';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await productService.getProducts();
        setProducts(fetchedProducts);
        setError(null);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">LTK Products</h1>
      
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4 text-yellow-800">
          <p>No products found. Check back later!</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <ProductGrid products={products} />
      )}
    </div>
  );
} 