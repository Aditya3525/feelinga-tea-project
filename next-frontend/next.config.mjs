/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API requests to Express backend during development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
    ];
  },
  images: {
    domains: ['localhost', '127.0.0.1'],
  },
};

export default nextConfig;
