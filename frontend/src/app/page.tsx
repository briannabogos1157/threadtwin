'use client';

export default function Home() {
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

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1>Paste a product link or upload an image</h1>
          <div className="search-container mt-8">
            <input
              type="text"
              placeholder="Find Dupes"
              className="search-input"
            />
            <button className="search-button">
              Find Dupes
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4">
        <h2 className="text-center">How it Works</h2>
        <div className="how-it-works-grid">
          <div className="feature-card">
            <div className="icon-container">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Paste Link</h3>
          </div>
          <div className="feature-card">
            <div className="icon-container">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyze Fabric</h3>
          </div>
          <div className="feature-card">
            <div className="icon-container">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Dupes</h3>
          </div>
        </div>
      </section>

      {/* Featured Dupes */}
      <section className="py-16 px-4">
        <h2 className="text-center">Featured Dupes</h2>
        <div className="featured-dupes-grid">
          <div className="dupe-card">
            <div className="dupe-image" />
            <div className="dupe-content">
              <div className="match-percentage">80% match</div>
              <div className="match-quality">Very similar</div>
              <div className="price">$50</div>
            </div>
          </div>
          <div className="dupe-card">
            <div className="dupe-image" />
            <div className="dupe-content">
              <div className="match-percentage">64% match</div>
              <div className="match-quality">Good dupe</div>
              <div className="price">$45</div>
            </div>
          </div>
          <div className="dupe-card">
            <div className="dupe-image" />
            <div className="dupe-content">
              <div className="match-percentage">76% match</div>
              <div className="match-quality">Fair dupe</div>
              <div className="price">$33</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 