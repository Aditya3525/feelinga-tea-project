/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API requests to Express backend during development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
