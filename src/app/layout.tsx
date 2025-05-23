import React from 'react';
import '../styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ThreadTwin - Fabric-Powered Dupe Finder',
  description: 'Find high-quality fashion dupes based on fabric composition, construction, fit, and care instructions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 