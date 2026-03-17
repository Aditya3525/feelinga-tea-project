const fallbackApiOrigin = 'http://127.0.0.1:5000';
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || fallbackApiOrigin).replace(/\/$/, '');

const remotePatterns = [
  { protocol: 'http', hostname: 'localhost', port: '5000' },
  { protocol: 'http', hostname: '127.0.0.1', port: '5000' },
];

try {
  const parsedApiUrl = new URL(apiOrigin);
  remotePatterns.push({
    protocol: parsedApiUrl.protocol.replace(':', ''),
    hostname: parsedApiUrl.hostname,
    ...(parsedApiUrl.port ? { port: parsedApiUrl.port } : {}),
  });
} catch {
  // Ignore invalid deployment URL and keep local development hosts.
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;
