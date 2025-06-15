import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="flex justify-between items-center py-4 px-8 border-b bg-white">
      <Link href="/" className="text-2xl font-bold">
        ThreadTwin
      </Link>
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-lg text-gray-600 hover:text-gray-900">
          Home
        </Link>
        <Link 
          href="/submit-dupe" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Submit Dupe
        </Link>
        <Link href="/about" className="text-lg text-gray-600 hover:text-gray-900">
          About
        </Link>
      </div>
    </nav>
  );
} 