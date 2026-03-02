'use client';
import Layout from '../../components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '../../components/ProductCard';
import SectionHeader from '../../components/SectionHeader';
import { useToast } from '../../components/Toast';

const giftSets = [
    { name: 'Spring Festival Tea Box', type: 'Gift Collection', note: '5 curated teas in a premium gift box', price: 1499, img: '/images/gift-box.png', stars: 5, reviews: 45 },
    { name: 'Wellness Ritual Box', type: 'Gift Collection', note: '3 wellness blends with bamboo infuser', price: 999, img: '/images/gift-box.png', stars: 5, reviews: 67 },
    { name: "Connoisseur's Collection", type: 'Luxury Hamper', note: '8 rare teas with teaware in wooden chest', price: 3999, img: '/images/gift-box.png', stars: 5, reviews: 28 },
    { name: 'Tea & Honey Pairing Set', type: 'Gift Collection', note: '2 teas paired with artisanal honey', price: 799, img: '/images/herbal-tea.png', stars: 4, reviews: 34 },
];

import { renderStars } from '../../utils/renderStars';

export default function Gifting() {
    const { showToast } = useToast();

    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Gifting</span></nav>
                    <p className="overline">The Perfect Present</p>
                    <h1>Tea Gifting</h1>
                    <p>Beautifully curated tea gift sets for every occasion — wrapped with love, steeped with care.</p>
                </div>
            </div>

            {/* Gift Sets */}
            <section className="section">
                <div className="container">
                    <SectionHeader overline="Gift Collections" title="Curated Gift Sets" className="fade-in" />
                    <div className="product-grid fade-in">
                        {giftSets.map((g, i) => (
                            <ProductCard
                                key={i}
                                product={g}
                                badge="Gift Set"
                                badgeClass="product-card__badge--success"
                                renderStars={renderStars}
                                linkHref="/gifting"
                                footer={
                                    <Link
                                        href="/contact"
                                        className="btn btn--primary btn--sm btn-block mt-12"
                                        onClick={() => showToast('Contact us to order this gift set!', 'info')}
                                    >
                                        Enquire Now
                                    </Link>
                                }
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Corporate Gifting */}
            <section className="section section--alt">
                <div className="container">
                    <div className="story-grid fade-in">
                        <div className="story__content">
                            <p className="overline">For Businesses</p>
                            <h2>Corporate Gifting</h2>
                            <p>Impress clients, celebrate milestones, and reward your team with our bespoke corporate gifting program. Custom branding, personalized messages, and premium packaging available for orders of 25+ boxes.</p>
                            <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2 }}>
                                <li>✅ Custom branding & packaging</li>
                                <li>✅ Personalized greeting cards</li>
                                <li>✅ Bulk pricing (25+ boxes)</li>
                                <li>✅ Pan-India delivery</li>
                                <li>✅ Dedicated account manager</li>
                            </ul>
                            <div style={{ marginTop: 'var(--space-xl)' }}>
                                <Link href="/contact" className="btn btn--primary">Get a Quote</Link>
                            </div>
                        </div>
                        <div className="story__visual">
                            <Image src="/images/gift-box.png" alt="Corporate tea gift boxes" width={500} height={400} style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Occasions */}
            <section className="section">
                <div className="container">
                    <div className="section-header fade-in">
                        <p className="overline">Perfect For</p>
                        <h2>Every Occasion</h2>
                    </div>
                    <div className="mood-grid fade-in">
                        {[
                            { icon: '🎂', title: 'Birthdays', desc: 'A thoughtful, healthy gift they\'ll actually love.' },
                            { icon: '💍', title: 'Weddings', desc: 'Elegant favors and hampers for the special day.' },
                            { icon: '🏢', title: 'Corporate', desc: 'Premium gifts that leave a lasting impression.' },
                            { icon: '🎄', title: 'Festivals', desc: 'Diwali, Christmas, Eid — tea for every celebration.' },
                            { icon: '💝', title: 'Thank You', desc: 'Show gratitude with the gift of good tea.' },
                        ].map((o, i) => (
                            <div className="mood-card" key={i} style={{ cursor: 'default' }}>
                                <div className="mood-card__icon">{o.icon}</div>
                                <h4>{o.title}</h4>
                                <p>{o.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </Layout>
    );
}



