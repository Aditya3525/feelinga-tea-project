import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Feelinga',
        short_name: 'Feelinga',
        description: 'Happiness is here. Premium loose leaf teas sourced from the finest Indian estates.',
        start_url: '/',
        display: 'standalone',
        background_color: '#FAEDE4',
        theme_color: '#FAEDE4',
        icons: [
            {
                src: '/images/logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/images/logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
