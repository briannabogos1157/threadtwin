'use client';

export default function About() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">ThreadTwin</h1>
            <div className="space-x-8">
              <a href="/" className="nav-link">Home</a>
              <a href="/about" className="nav-link">About</a>
            </div>
          </div>
        </div>
      </nav>

      {/* About Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-center mb-12">About ThreadTwin</h1>
          
          <div className="prose lg:prose-lg mx-auto">
            <p className="text-lg mb-6">
              ThreadTwin is your ultimate fashion companion, helping you find affordable alternatives to your favorite designer pieces. Using advanced AI technology, we analyze fabric patterns, textures, and styles to find the closest matches at better prices.
            </p>

            <p className="text-lg mb-6">
              Our mission is to make fashion more accessible while helping you maintain the style you love. Whether you're looking for designer-inspired pieces or trying to stay within budget, ThreadTwin helps you discover the perfect alternatives.
            </p>

            <div className="bg-gray-50 rounded-lg p-8 my-12">
              <h2 className="text-xl font-semibold mb-4">Company Information</h2>
              <p className="mb-2">Find The Perfect Outfit LLC</p>
              <p className="text-gray-600">Founded by Brianna Bogos</p>
              <a 
                href="https://instagram.com/briannabogoss" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center mt-4 text-gray-600 hover:text-black"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                @briannabogoss
              </a>
            </div>

            <div className="text-center text-gray-600 mt-12">
              <p>Have questions? Contact us at:</p>
              <a href="mailto:info@threadtwin.com" className="text-black hover:underline">
                info@threadtwin.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 