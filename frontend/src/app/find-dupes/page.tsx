import DupeFinder from '@/components/DupeFinder';

export default function FindDupesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Fashion Dupe Finder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Looking for affordable alternatives to luxury fashion? Let our AI help you find similar styles at better prices.
          </p>
        </div>
        
        <DupeFinder />
      </div>
    </main>
  );
} 