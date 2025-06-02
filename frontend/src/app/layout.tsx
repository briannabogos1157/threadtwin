import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ThreadTwin - Fashion Dupe Finder',
  description: 'Find similar clothing items based on fabric composition, fit, and construction details.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="impact-site-verification" content="892529f6-40dc-4338-bd75-9ca9e27a8168" />
        <Script
          src="https://s.skimresources.com/js/285945X1772465.skimlinks.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.className} min-h-full`}>
        {children}
      </body>
    </html>
  );
} 