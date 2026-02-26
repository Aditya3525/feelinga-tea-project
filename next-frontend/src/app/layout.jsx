import Providers from '../components/Providers';
import '../styles/styles.css';

export const metadata = {
    title: 'feelinga — happiness is here',
    description: 'Discover premium loose leaf teas sourced from the finest estates. Garden-fresh, single-origin, wellness-focused.',
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
