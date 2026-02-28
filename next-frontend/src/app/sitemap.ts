import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.feelinga.com';

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

    // Fetch all product slugs from API
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
        const res = await fetch(`${apiBase}/api/v1/products?limit=500`, {
            next: { revalidate: 3600 }, // revalidate every hour
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
        // If API is unreachable, return static pages only
    }

    return [...staticPages, ...productPages];
}
