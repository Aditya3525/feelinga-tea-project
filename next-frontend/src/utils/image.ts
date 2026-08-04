const LOCAL_API_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i;

function getBackendOrigin(): string {
    const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/^"(.+)"$/, '$1').replace(/\/$/, '');
    if (configured) {
        return configured.replace(/\/api\/v1$/i, '').replace(/\/api$/i, '');
    }
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'https://feelinga-tea-api.onrender.com';
        }
    } else {
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            return 'https://feelinga-tea-api.onrender.com';
        }
    }
    return '';
}

export function resolveProductImageUrl(raw?: string | null, fallback = '/images/darjeeling-tea.png'): string {
    const value = String(raw || '').trim();
    if (!value) return fallback;

    let normalized = value.replace(/\\/g, '/');

    // Convert DB values like "uploads/products/x.jpg" into relative paths first.
    if (normalized.startsWith('uploads/')) {
        normalized = `/${normalized}`;
    }

    // Convert localhost API image links into relative uploads.
    if (LOCAL_API_ORIGIN.test(normalized)) {
        const uploadIndex = normalized.indexOf('/uploads/');
        if (uploadIndex !== -1) {
            normalized = normalized.slice(uploadIndex);
        }
    }

    // If the value already contains uploads path but without a leading slash.
    if (!normalized.startsWith('/') && normalized.includes('/uploads/')) {
        normalized = normalized.slice(normalized.indexOf('/uploads/'));
    }

    // Prepend backend origin in production for absolute image retrieval.
    if (normalized.startsWith('/uploads/')) {
        const origin = getBackendOrigin();
        if (origin) {
            return `${origin}${normalized}`;
        }
    }

    return normalized;
}

export function resolveProductImageList(images?: string[] | null): string[] {
    if (!Array.isArray(images)) return [];
    return images
        .map((image) => resolveProductImageUrl(image, ''))
        .filter(Boolean);
}
