import React from 'react';
import Link from 'next/link';

export default function About() {
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-10">
      <header className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">ThreadTwin</h1>
        <nav className="space-x-4">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/about" className="hover:underline">About</Link>
        </nav>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-4">About</h2>
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              ThreadTwin is on a mission to make fashion accessible. We help you find dupes that feel and fit like the real thing — based on fabric, not just looks.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">How We Work</h3>
            <p className="text-gray-600 leading-relaxed">
              Our technology analyzes fabric composition, construction type, fit, and care instructions to find the closest matches. We believe in transparency, which is why we show you exactly how similar each dupe is to the original.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
        <form className="border rounded-lg p-6 space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Name" 
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
            />
          </div>
          <div>
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
            />
          </div>
          <div>
            <textarea 
              placeholder="Message" 
              rows={4}
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            ></textarea>
          </div>
          <button type="submit" className="btn-primary">
            Submit
          </button>
        </form>
      </section>
    </main>
  );
} 