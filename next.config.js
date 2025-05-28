/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ]
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`
        }
      ]
    }
  },
  async redirects() {
    return [
      {
        source: '/www.threadtwin.com/:path*',
        destination: 'https://threadtwin.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig 