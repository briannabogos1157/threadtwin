import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="flex justify-between items-center py-4 px-8 border-b">
      <Link href="/" className="text-2xl font-bold">
        ThreadTwin
      </Link>
      <div className="space-x-8">
        <Link href="/" className="text-lg">
          Home
        </Link>
        <Link href="/submit-dupe" className="text-lg text-blue-500 hover:text-blue-600">
          Submit Dupe
        </Link>
        <Link href="/about" className="text-lg">
          About
        </Link>
      </div>
    </nav>
  );
} 