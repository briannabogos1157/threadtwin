import React from 'react';
import ProductSearch from '../components/ProductSearch';

const SearchPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Product Search
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Search for products across multiple merchants
            </p>
          </div>
          <div className="mt-12">
            <ProductSearch />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage; 