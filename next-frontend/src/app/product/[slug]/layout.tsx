import type { Metadata } from 'next';

async function fetchProduct(slug: string) {
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/v1/products/${slug}`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => ({}));
        return json.data ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata> {
    const product = await fetchProduct(params.slug);

    if (!product) {
        return {
            title: 'Premium Tea — Feelinga',
            description: 'Discover premium loose leaf teas from India\'s finest estates, sourced and delivered fresh by Feelinga.',
        };
    }

    const description =
        product.shortDescription ||
        (product.description ? String(product.description).slice(0, 160) : '') ||
        `Buy ${product.name} — premium ${product.type ?? 'tea'} from Feelinga.`;

    const ogImage = product.images?.[0]
        ? `http://127.0.0.1:5000${product.images[0]}`
        : undefined;

    return {
        title: `${product.name} — Feelinga`,
        description,
        openGraph: {
            title: `${product.name} — Feelinga`,
            description,
            type: 'website',
            ...(ogImage ? { images: [{ url: ogImage }] } : {}),
        },
    };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return children;
}
