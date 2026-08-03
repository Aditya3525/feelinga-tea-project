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
  { protocol: 'https', hostname: 'feelinga-tea-api.onrender.com' },
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

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    // Allows Google Fonts, Google Identity/OAuth popup, and the Render API origin.
    // 'unsafe-inline' on style/script needed for Next.js hydration and Google Sign-In.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "frame-src https://accounts.google.com",
      `connect-src 'self' ${apiOrigin} https://accounts.google.com`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
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
