const fallbackApiOrigin = 'http://127.0.0.1:5000';

function sanitizeApiOrigin(raw) {
  const trimmed = String(raw || '').trim().replace(/^"(.+)"$/, '$1');
  const noTrailingSlash = trimmed.replace(/\/$/, '');
  return noTrailingSlash.replace(/\/api(?:\/v1)?$/i, '');
}

const apiOrigin = sanitizeApiOrigin(process.env.NEXT_PUBLIC_API_URL || fallbackApiOrigin);

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
