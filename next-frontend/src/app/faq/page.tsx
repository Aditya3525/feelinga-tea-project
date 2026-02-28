'use client';
import Layout from '../../components/Layout';
import { useState } from 'react';
import Link from 'next/link';

const faqData = [
    {
        category: 'Ordering', items: [
            { q: 'How do I place an order?', a: 'Browse our shop, add items to your cart, and proceed to checkout. You can pay via COD, UPI, or card.' },
            { q: 'Can I modify my order after placing it?', a: 'Orders can be modified within 2 hours of placement. Please contact us at hello@feelinga.com.' },
            { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD), UPI, and all major credit/debit cards.' },
        ]
    },
    {
        category: 'Shipping', items: [
            { q: 'How long does delivery take?', a: 'Standard delivery takes 3–5 business days. Metro cities may receive orders in 2–3 days.' },
            { q: 'Do you offer free shipping?', a: 'Yes! Orders above ₹999 qualify for free shipping across India.' },
            { q: 'Do you ship internationally?', a: 'We currently ship to UAE and Singapore. More countries will be added soon.' },
        ]
    },
    {
        category: 'Products', items: [
            { q: 'Are your teas organic?', a: 'Many of our teas are certified organic. Look for the organic badge on product pages.' },
            { q: 'How should I store my tea?', a: 'Store in a cool, dry place away from direct sunlight. Keep the pouch sealed or use an airtight container.' },
            { q: 'What is the shelf life of your teas?', a: 'Our loose leaf teas stay fresh for 12–18 months when stored properly.' },
        ]
    },
    {
        category: 'Returns', items: [
            { q: 'What is your return policy?', a: 'If you are not satisfied, contact us within 7 days of delivery for a full refund or exchange.' },
            { q: 'How do I return a product?', a: 'Email us at hello@feelinga.com with your order number. We will arrange a pickup.' },
        ]
    },
];

export default function FAQ() {
    const [openItems, setOpenItems] = useState({});

    const toggle = (key) => {
        setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>FAQ</span></nav>
                    <p className="overline">Help Center</p>
                    <h1>Frequently Asked Questions</h1>
                    <p>Find answers to common questions about ordering, shipping, and more.</p>
                </div>
            </div>

            <section className="section">
                <div className="container" style={{ maxWidth: '800px' }}>
                    {faqData.map((section, si) => (
                        <div key={si} style={{ marginBottom: 'var(--space-2xl)' }}>
                            <h2 style={{ marginBottom: 'var(--space-md)' }}>{section.category}</h2>
                            {section.items.map((item, qi) => {
                                const key = `${si}-${qi}`;
                                return (
                                    <div key={key} className="faq-item" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                        <button className="faq-item__question" onClick={() => toggle(key)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 'var(--space-sm) 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text)' }}>
                                            {item.q}
                                            <span style={{ transition: 'transform 0.3s', transform: openItems[key] ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                                        </button>
                                        {openItems[key] && (
                                            <div className="faq-item__answer" style={{ padding: 'var(--space-sm) 0', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    <div className="text-center" style={{ marginTop: 'var(--space-3xl)' }}>
                        <h3>Still have questions?</h3>
                        <p style={{ margin: 'var(--space-sm) 0 var(--space-lg)' }}>Our team is happy to help.</p>
                        <Link href="/contact" className="btn btn--primary">Contact Us</Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}



