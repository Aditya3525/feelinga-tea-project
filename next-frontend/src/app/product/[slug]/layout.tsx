import type { Metadata } from 'next';
import {
    buildProductJsonLd,
    fetchProductSeo,
    getAbsoluteImageUrl,
    getPrimaryPrice,
    getProductCanonicalPath,
    getProductDescription,
    getProductSeoTitle,
} from './seo';

type ProductRouteParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: ProductRouteParams }): Promise<Metadata> {
    const resolved = await params;
    const slug = resolved?.slug;

    if (!slug) {
        return {
            title: 'Product Not Found',
            description: 'The requested tea product could not be found.',
            robots: { index: false, follow: false },
        };
    }

    const product = await fetchProductSeo(slug);

    if (!product) {
        return {
            title: 'Product Not Found',
            description: 'The requested tea product could not be found.',
            robots: { index: false, follow: false },
        };
    }

    const title = getProductSeoTitle(product);
    const description = getProductDescription(product);
    const image = getAbsoluteImageUrl(product.images?.[0]) || '/images/tea-lifestyle.png';
    const canonicalPath = getProductCanonicalPath(product, slug);
    const primaryPrice = getPrimaryPrice(product);

    return {
        title,
        description,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title,
            description,
            type: 'website',
            url: canonicalPath,
            images: [
                {
                    url: image,
                    alt: product.name || 'Feelinga tea product',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
        robots: {
            index: true,
            follow: true,
        },
        other: {
            'product:price:amount': String(primaryPrice),
            'product:price:currency': 'INR',
            'product:availability': product.inStock ? 'in stock' : 'out of stock',
        },
    };
}

export default async function ProductSlugLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: ProductRouteParams;
}) {
    const resolved = await params;
    const slug = resolved?.slug;

    if (!slug) return children;

    const product = await fetchProductSeo(slug);
    const jsonLd = product ? JSON.stringify(buildProductJsonLd(product, slug)) : null;

    return (
        <>
            {children}
            {jsonLd && (
                <script
                    id="product-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: jsonLd }}
                />
            )}
        </>
    );
}
