'use client';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function Privacy() {
    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Privacy Policy</span></nav>
                    <h1>Privacy Policy</h1>
                </div>
            </div>
            <div className="container section" style={{ maxWidth: 800, margin: '0 auto' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)' }}>Last updated: January 2026</p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>1. Information We Collect</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    When you use Feelinga, we collect information you provide directly — such as your name, email address, phone number, shipping address, and payment details when placing an order. We also collect usage data including pages visited, browser type, and device information to improve our services.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>2. How We Use Your Information</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    We use your information to process and fulfill orders, communicate about your orders and account, send promotional emails (with your consent), improve our website and services, and comply with legal obligations. We never sell your personal data to third parties.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>3. Data Security</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    We implement industry-standard security measures including encrypted data transmission (SSL/TLS), secure password hashing, and access controls. While no method of electronic storage is 100% secure, we strive to protect your personal information.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>4. Cookies</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    We use essential cookies for authentication and cart functionality. We may also use analytics cookies to understand how visitors interact with our website. You can configure your browser to refuse cookies, though some features may not function properly.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>5. Your Rights</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    You have the right to access, update, or delete your personal information at any time through your account settings. You may also unsubscribe from marketing emails using the link provided in each email. For data deletion requests, please contact us at <a href="mailto:privacy@feelinga.in">privacy@feelinga.in</a>.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>6. Contact Us</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-xl)' }}>
                    If you have questions about this privacy policy or our data practices, please reach out to us at <a href="mailto:privacy@feelinga.in">privacy@feelinga.in</a> or through our <Link href="/contact">contact page</Link>.
                </p>
            </div>
        </Layout>
    );
}
