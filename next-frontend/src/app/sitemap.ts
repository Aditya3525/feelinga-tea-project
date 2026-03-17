import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.feelinga.com');
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
const SITEMAP_FETCH_TIMEOUT_MS = 5000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${BASE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/learn`, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/gifting`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    ];

    // Fetch product slugs, but fail fast so sitemap generation never blocks deployment.
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/products?limit=500`, {
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(SITEMAP_FETCH_TIMEOUT_MS),
        });
        if (res.ok) {
            const data = await res.json();
            const products = data.data || [];
            productPages = products.map((product: { slug: string; updatedAt?: string }) => ({
                url: `${BASE_URL}/product/${product.slug}`,
                lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            }));
        }
    } catch {
        // If the API is unavailable or slow, return static pages and keep the build moving.
    }

    return [...staticPages, ...productPages];
}
