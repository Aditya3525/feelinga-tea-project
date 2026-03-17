import { cache } from 'react';

export type ProductSeoShape = {
    name?: string;
    slug?: string;
    type?: string;
    shortDescription?: string;
    description?: string;
    images?: string[];
    prices?: Record<string, number>;
    inStock?: boolean;
    rating?: number;
    reviewCount?: number;
};

type ProductSeoResponse = {
    status?: string;
    data?: ProductSeoShape;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')).replace(/\/$/, '');

function normalizeBase(base: string): string {
    return base.replace(/\/$/, '');
}

function buildProductApiUrl(base: string, slug: string): string {
    const normalized = normalizeBase(base);
    if (/\/api\/v1$/i.test(normalized)) {
        return `${normalized}/products/${encodeURIComponent(slug)}`;
    }
    if (/\/api$/i.test(normalized)) {
        return `${normalized}/v1/products/${encodeURIComponent(slug)}`;
    }
    return `${normalized}/api/v1/products/${encodeURIComponent(slug)}`;
}

function getApiOrigins(): string[] {
    const configured = [
        process.env.API_URL,
        process.env.NEXT_PUBLIC_API_URL,
        'http://127.0.0.1:5000',
        'http://localhost:5000',
        SITE_URL,
    ].filter((v): v is string => Boolean(v));

    return Array.from(new Set(configured.map(normalizeBase)));
}

export function getProductDescription(product: ProductSeoShape): string {
    const raw = product.shortDescription || product.description || 'Explore premium loose leaf teas from Feelinga.';
    return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
}

export function getProductSeoTitle(product: ProductSeoShape): string {
    const name = (product.name || 'Premium Tea').trim();
    const rawType = (product.type || '').trim();

    if (!rawType) return `${name} - Premium Tea`;

    const typeLabel = /tea$/i.test(rawType) ? rawType : `${rawType} Tea`;
    return `${name} - Premium ${typeLabel}`;
}

export function getProductCanonicalPath(product: ProductSeoShape, fallbackSlug: string): string {
    return `/product/${product.slug || fallbackSlug}`;
}

export function getPrimaryPrice(product: ProductSeoShape): number {
    if (product.prices?.['100g']) return product.prices['100g'];
    const values = Object.values(product.prices || {}).filter(v => typeof v === 'number' && v > 0);
    return values[0] || 0;
}

export function getAbsoluteImageUrl(image: string | undefined): string | undefined {
    if (!image) return undefined;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;

    const normalized = image.startsWith('/') ? image : `/${image}`;
    return `${SITE_URL}${normalized}`;
}

export const fetchProductSeo = cache(async (slug: string): Promise<ProductSeoShape | null> => {
    const origins = getApiOrigins();

    for (const origin of origins) {
        try {
            const res = await fetch(buildProductApiUrl(origin, slug), {
                next: { revalidate: 300 },
            });
            if (!res.ok) continue;

            const payload = (await res.json()) as ProductSeoResponse;
            if (payload?.data) return payload.data;
        } catch {
            // Try next origin fallback.
        }
    }

    return null;
});

export function buildProductJsonLd(product: ProductSeoShape, fallbackSlug: string) {
    const path = getProductCanonicalPath(product, fallbackSlug);
    const image = getAbsoluteImageUrl(product.images?.[0]);

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.shortDescription || product.description,
        image: image ? [image] : undefined,
        sku: product.slug,
        brand: { '@type': 'Brand', name: 'Feelinga' },
        offers: {
            '@type': 'Offer',
            url: `${SITE_URL}${path}`,
            priceCurrency: 'INR',
            price: getPrimaryPrice(product),
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        ...(product.rating && (product.reviewCount || 0) > 0
            ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: product.rating,
                    reviewCount: product.reviewCount,
                },
            }
            : {}),
    };
}
