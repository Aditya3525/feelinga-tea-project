'use client';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function Terms() {
    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Terms of Service</span></nav>
                    <h1>Terms of Service</h1>
                </div>
            </div>
            <div className="container section" style={{ maxWidth: 800, margin: '0 auto' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)' }}>Last updated: January 2026</p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>1. Acceptance of Terms</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    By accessing or using the feelinga website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>2. Products & Orders</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    All products are subject to availability. We reserve the right to limit quantities, refuse orders, or cancel orders at our discretion. Prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Product images are representative and actual products may vary slightly.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>3. Shipping & Delivery</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    We ship across India. Orders above ₹999 qualify for free shipping. Standard delivery takes 5-7 business days. Delivery timelines are estimates and may vary based on location and availability. We are not responsible for delays caused by shipping carriers or force majeure events.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>4. Cancellations & Returns</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    Orders can be cancelled before they are shipped. Once shipped, cancellations are not possible. We accept returns of unopened products within 7 days of delivery. Perishable items and opened packages cannot be returned. Refunds will be processed within 7-10 business days of receiving the return.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>5. User Accounts</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and current information. We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>6. Intellectual Property</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    All content on this website — including text, images, logos, and graphics — is the property of feelinga and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>7. Limitation of Liability</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                    feelinga shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid for the specific product or service in question.
                </p>

                <h2 style={{ marginBottom: 'var(--space-md)' }}>8. Contact</h2>
                <p style={{ lineHeight: 1.8, marginBottom: 'var(--space-xl)' }}>
                    For questions about these terms, please contact us at <a href="mailto:legal@feelinga.in">legal@feelinga.in</a> or through our <Link href="/contact">contact page</Link>.
                </p>
            </div>
        </Layout>
    );
}
