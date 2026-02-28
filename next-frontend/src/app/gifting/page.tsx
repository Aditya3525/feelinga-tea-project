'use client';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useToast } from '../../components/Toast';

const giftSets = [
    { name: 'Spring Festival Tea Box', desc: '5 curated teas in a premium gift box', price: 1499, img: '/images/gift-box.png' },
    { name: 'Wellness Ritual Box', desc: '3 wellness blends with bamboo infuser', price: 999, img: '/images/gift-box.png' },
    { name: "Connoisseur's Collection", desc: '8 rare teas with teaware in wooden chest', price: 3999, img: '/images/gift-box.png' },
    { name: 'Tea & Honey Pairing Set', desc: '2 teas paired with artisanal honey', price: 799, img: '/images/herbal-tea.png' },
];

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
                    <div className="section-header fade-in">
                        <p className="overline">Gift Collections</p>
                        <h2>Curated Gift Sets</h2>
                    </div>
                    <div className="product-grid fade-in">
                        {giftSets.map((g, i) => (
                            <div className="product-card" key={i}>
                                <span className="product-card__badge" style={{ background: 'var(--color-success)' }}>Gift Set</span>
                                <div className="product-card__img"><img src={g.img} alt={g.name} /></div>
                                <div className="product-card__body">
                                    <div className="product-card__type">Gift Collection</div>
                                    <div className="product-card__name">{g.name}</div>
                                    <div className="product-card__note">{g.desc}</div>
                                    <div className="product-card__bottom">
                                        <div className="product-card__price">₹{g.price.toLocaleString()}</div>
                                        <div className="product-card__rating">★★★★★</div>
                                    </div>
                                    <Link href="/contact" className="btn btn--primary btn--sm" style={{ width: '100%', marginTop: '12px', textAlign: 'center' }} onClick={() => showToast('Contact us to order this gift set!', 'info')}>Enquire Now</Link>
                                </div>
                            </div>
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
                            <img src="/images/gift-box.png" alt="Corporate tea gift boxes" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }} />
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



