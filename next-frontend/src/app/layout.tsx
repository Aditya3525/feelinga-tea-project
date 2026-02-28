import Providers from '../components/Providers';
import '../styles/styles.css';

export const metadata = {
    title: {
        default: 'Feelinga — happiness is here',
        template: '%s | Feelinga',
    },
    description: 'Discover premium loose leaf teas sourced from the finest Indian estates. Garden-fresh, single-origin, wellness-focused.',
    keywords: ['tea', 'premium tea', 'loose leaf tea', 'Indian tea', 'green tea', 'black tea', 'herbal tea', 'wellness tea'],
    authors: [{ name: 'Feelinga' }],
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        siteName: 'Feelinga',
        title: 'Feelinga — happiness is here',
        description: 'Discover premium loose leaf teas sourced from the finest Indian estates.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Feelinga — happiness is here',
        description: 'Premium loose leaf teas from India\'s finest estates.',
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: '/images/logo.png',
        apple: '/images/logo.png',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <a href="#main" className="skip-link">Skip to main content</a>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
