'use client';
import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useCart } from '../context/CartContext';

export default function Home() {
    const [activeTab, setActiveTab] = useState('new');
    const { addToCart } = useCart();

    return (
        <Layout>
            {/* 1. HERO */}
            <section className="hero">
                <div className="hero__bg"></div>
                <div className="hero__overlay"></div>
                <div className="container hero__content">
                    <div className="hero__trust">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" /></svg>
                        <span>Garden-Fresh · Single-Origin · Wellness-Focused</span>
                    </div>
                    <h1>Happiness Is <em>Here</em></h1>
                    <p className="subtitle">From handpicked gardens to your cup — discover premium teas that bring joy to your body, calm your mind, and brighten your everyday moments.</p>
                    <div className="hero__ctas">
                        <Link href="/shop" className="btn btn--primary">Shop Teas</Link>
                        <Link href="/about" className="btn btn--secondary">Our Story</Link>
                    </div>
                </div>
                <div className="hero__decor" aria-hidden="true">
                    <div className="hero__decor-inner"><img src="/images/tea-lifestyle.png" alt="Tea ritual" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /></div>
                </div>
            </section>

            {/* 2. SHOP BY MOOD */}
            <section className="section" id="moods">
                <div className="container">
                    <div className="section-header fade-in">
                        <p className="overline">Find Your Blend</p>
                        <h2>Shop by Mood</h2>
                        <p>Let your mood guide you to the perfect cup.</p>
                    </div>
                    <div className="mood-grid fade-in">
                        {[
                            { mood: 'energize', icon: '⚡', title: 'Energize', desc: 'Start your day with vibrant, uplifting blends.' },
                            { mood: 'relax', icon: '🌿', title: 'Relax', desc: 'Soothing teas that melt away the day\'s stress.' },
                            { mood: 'focus', icon: '🧠', title: 'Focus', desc: 'Sharpen your clarity and stay centered.' },
                            { mood: 'detox', icon: '💧', title: 'Detox', desc: 'Light, detoxifying infusions for renewal.' },
                            { mood: 'glow', icon: '✨', title: 'Glow', desc: 'Nourish your skin and radiate from within.' },
                        ].map(m => (
                            <Link href={`/shop?mood=${m.mood}`} className="mood-card" key={m.mood}>
                                <div className="mood-card__icon">{m.icon}</div>
                                <h4>{m.title}</h4>
                                <p>{m.desc}</p>
                                <span className="btn btn--ghost btn--sm">Explore</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. PRODUCT TABS */}
            <section className="section section--alt">
                <div className="container">
                    <div className="section-header fade-in">
                        <p className="overline">Our Collection</p>
                        <h2>Discover Our Teas</h2>
                    </div>
                    <div className="commerce-tabs fade-in" role="tablist">
                        {[{ key: 'new', label: 'New Arrivals' }, { key: 'best', label: 'Best Sellers' }, { key: 'seasonal', label: 'Seasonal Gifts' }].map(t => (
                            <button key={t.key} className={`commerce-tab ${activeTab === t.key ? 'active' : ''}`} role="tab" aria-selected={activeTab === t.key} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                        ))}
                    </div>

                    {/* New Arrivals */}
                    <div className="product-grid fade-in" style={{ display: activeTab === 'new' ? '' : 'none' }}>
                        {[
                            { name: 'Moonlight White Peony', type: 'White Tea', price: 899, reviews: 24, img: '/images/white-tea.png', badge: 'New', note: 'Delicate floral with honey sweetness' },
                            { name: 'Rose Chamomile Dream', type: 'Herbal Infusion', price: 649, reviews: 18, img: '/images/herbal-tea.png', badge: 'New', note: 'Soothing blend of rose petals & chamomile' },
                            { name: 'Spring Flush Sencha', type: 'Green Tea', price: 749, reviews: 31, img: '/images/green-tea.png', badge: 'New', note: 'Bright, grassy with umami finish', halfStar: true },
                            { name: 'Darjeeling Muscatel Oolong', type: 'Oolong', price: 1199, reviews: 12, img: '/images/oolong-tea.png', badge: 'New', note: 'Rich muscatel grape with malty depth' },
                        ].map((p, i) => (
                            <div className="product-card" key={i}>
                                <span className="product-card__badge">{p.badge}</span>
                                <div className="product-card__img"><img src={p.img} alt={`${p.name} tea`} /></div>
                                <div className="product-card__body">
                                    <div className="product-card__type">{p.type}</div>
                                    <div className="product-card__name">{p.name}</div>
                                    <div className="product-card__note">{p.note}</div>
                                    <div className="product-card__bottom">
                                        <div className="product-card__price">₹{p.price.toLocaleString()}</div>
                                        <div className="product-card__rating">{p.halfStar ? '★★★★☆' : '★★★★★'} <span>({p.reviews})</span></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Best Sellers */}
                    <div className="product-grid" style={{ display: activeTab === 'best' ? '' : 'none' }}>
                        {[
                            { name: 'Classic Assam Breakfast', type: 'Black Tea', price: 499, reviews: 156, img: '/images/darjeeling-tea.png', note: 'Bold, malty with rich amber liquor' },
                            { name: 'Himalayan Green Reserve', type: 'Green Tea', price: 599, reviews: 203, img: '/images/green-tea.png', note: 'Light, refreshing with vegetal notes' },
                            { name: 'Heritage Spiced Chai', type: 'Masala Chai', price: 399, reviews: 312, img: '/images/masala-chai.png', note: 'Warm spices with CTC tea base' },
                            { name: 'Turmeric Golden Glow', type: 'Herbal', price: 549, reviews: 89, img: '/images/herbal-tea.png', note: 'Anti-inflammatory wellness blend' },
                        ].map((p, i) => (
                            <div className="product-card" key={i}>
                                <span className="product-card__badge" style={{ background: 'var(--color-gold)' }}>Best Seller</span>
                                <div className="product-card__img"><img src={p.img} alt={`${p.name} tea`} /></div>
                                <div className="product-card__body">
                                    <div className="product-card__type">{p.type}</div>
                                    <div className="product-card__name">{p.name}</div>
                                    <div className="product-card__note">{p.note}</div>
                                    <div className="product-card__bottom">
                                        <div className="product-card__price">₹{p.price.toLocaleString()}</div>
                                        <div className="product-card__rating">★★★★★ <span>({p.reviews})</span></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Seasonal Gifts */}
                    <div className="product-grid" style={{ display: activeTab === 'seasonal' ? '' : 'none' }}>
                        {[
                            { name: 'Spring Festival Tea Box', type: 'Gift Collection', price: 1499, reviews: 45, note: '5 curated teas in a premium gift box' },
                            { name: 'Wellness Ritual Box', type: 'Gift Collection', price: 999, reviews: 67, note: '3 wellness blends with infuser' },
                            { name: "Connoisseur's Collection", type: 'Luxury Hamper', price: 3999, reviews: 28, note: '8 rare teas with teaware in wooden chest' },
                            { name: 'Tea & Honey Pairing Set', type: 'Gift Collection', price: 799, reviews: 34, note: '2 teas paired with artisanal honey', halfStar: true },
                        ].map((p, i) => (
                            <div className="product-card" key={i}>
                                <span className="product-card__badge" style={{ background: 'var(--color-success)' }}>Gift Set</span>
                                <div className="product-card__img"><img src={i < 3 ? '/images/gift-box.png' : '/images/herbal-tea.png'} alt={p.name} /></div>
                                <div className="product-card__body">
                                    <div className="product-card__type">{p.type}</div>
                                    <div className="product-card__name">{p.name}</div>
                                    <div className="product-card__note">{p.note}</div>
                                    <div className="product-card__bottom">
                                        <div className="product-card__price">₹{p.price.toLocaleString()}</div>
                                        <div className="product-card__rating">{p.halfStar ? '★★★★☆' : '★★★★★'} <span>({p.reviews})</span></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center" style={{ marginTop: 'var(--space-2xl)' }}>
                        <Link href="/shop" className="btn btn--secondary">View All Teas</Link>
                    </div>
                </div>
            </section>

            {/* 4. TEA MASTER'S SELECTIONS */}
            <section className="section">
                <div className="container">
                    <div className="section-header fade-in">
                        <p className="overline">Expert Curated</p>
                        <h2>Tea Master&apos;s Selections</h2>
                        <p>Hand-picked by our master taster for exceptional quality and character.</p>
                    </div>
                    <div className="curated-grid fade-in">
                        {[
                            { name: 'First Flush Darjeeling', img: '/images/darjeeling-tea.png', desc: '"The champagne of teas — this spring harvest delivers an exquisite muscatel aroma with a light, floral body."', meta: '₹1,299 · Limited Edition' },
                            { name: 'Silver Needle White', img: '/images/white-tea.png', desc: '"Rare, hand-plucked buds with the most delicate sweetness. Best enjoyed in quiet afternoon solitude."', meta: '₹1,899 · Single Estate' },
                            { name: 'Aged Pu-erh Reserve', img: '/images/oolong-tea.png', desc: '"Deep, earthy complexity with a smooth, velvety finish. A meditative tea for the true connoisseur."', meta: '₹2,499 · Rare Find' },
                        ].map((c, i) => (
                            <div className="curated-card" key={i}>
                                <div className="curated-card__img"><img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /></div>
                                <div className="curated-card__body">
                                    <h4>{c.name}</h4>
                                    <p>{c.desc}</p>
                                    <div className="curated-card__meta">{c.meta}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. STORY & ORIGIN */}
            <section className="section section--alt">
                <div className="container">
                    <div className="story-grid fade-in">
                        <div className="story__content">
                            <p className="overline">Our Story</p>
                            <h2>Born from a Love of Ritual</h2>
                            <p>feelinga began with a simple belief: that a cup of tea can be a moment of mindfulness in a busy world. We partner directly with small-estate growers across Darjeeling, Assam, and the Nilgiris to bring you teas that are as kind to the earth as they are to your senses.</p>
                            <div className="story__stats">
                                <div><div className="story__stat-value">15+</div><div className="story__stat-label">Partner Estates</div></div>
                                <div><div className="story__stat-value">50+</div><div className="story__stat-label">Tea Varieties</div></div>
                                <div><div className="story__stat-value">10K+</div><div className="story__stat-label">Happy Sippers</div></div>
                            </div>
                            <div style={{ marginTop: 'var(--space-xl)' }}>
                                <Link href="/about" className="btn btn--ghost">Learn More About Us</Link>
                            </div>
                        </div>
                        <div className="story__visual">
                            <img src="/images/hero-estate.png" alt="Mist-covered tea gardens" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. LEARN THE ART OF TEA */}
            <section className="section">
                <div className="container">
                    <div className="section-header fade-in">
                        <p className="overline">Knowledge</p>
                        <h2>Learn the Art of Tea</h2>
                        <p>Explore guides, stories, and brewing wisdom from our experts.</p>
                    </div>
                    <div className="guide-grid fade-in">
                        {[
                            { icon: '🫖', title: 'The Perfect Brew', desc: 'Temperature, timing, and technique — master the art of brewing every tea type.' },
                            { icon: '🌱', title: 'Tea & Wellness', desc: 'How different teas support your immunity, digestion, and mental clarity.' },
                            { icon: '🗺️', title: 'Origin Stories', desc: "Journey through India's finest tea regions and meet the growers behind your cup." },
                        ].map((g, i) => (
                            <Link href="/learn" className="guide-card" key={i}>
                                <div className="guide-card__icon">{g.icon}</div>
                                <h4>{g.title}</h4>
                                <p>{g.desc}</p>
                                <span className="btn btn--ghost btn--sm">Read Guide</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. TESTIMONIALS */}
            <section className="section section--alt">
                <div className="container">
                    <div className="section-header fade-in">
                        <p className="overline">Reviews</p>
                        <h2>What Our Sippers Say</h2>
                    </div>
                    <div className="testimonials-track fade-in">
                        {[
                            { text: '"The Darjeeling First Flush is absolutely divine. It\'s like sipping on liquid sunshine — delicate, fragrant, and utterly refreshing. Best tea I\'ve had in years."', author: 'Priya Sharma', role: 'Tea Enthusiast, Mumbai' },
                            { text: '"I ordered the Wellness Ritual gift box for my mother and she was overjoyed. The packaging is gorgeous and the teas are exceptionally fresh. Will order again!"', author: 'Arjun Mehta', role: 'Repeat Customer, Delhi' },
                            { text: '"Their Heritage Spiced Chai has replaced my morning coffee entirely. The blend of spices is perfectly balanced — warm but never overwhelming. An everyday essential."', author: 'Kavya Nair', role: 'Wellness Coach, Bangalore' },
                            { text: '"As a café owner, I switched to feelinga for our premium tea menu. Our customers immediately noticed the quality difference. Exceptional sourcing and consistency."', author: 'Rohan Desai', role: 'Café Owner, Pune' },
                        ].map((t, i) => (
                            <div className="testimonial-card" key={i}>
                                <div className="testimonial-card__stars">★★★★★</div>
                                <div className="testimonial-card__text">{t.text}</div>
                                <div className="testimonial-card__author">{t.author}</div>
                                <div className="testimonial-card__role">{t.role}</div>
                            </div>
                        ))}
                    </div>
                    <div className="testimonials__summary fade-in"><strong>4.8 / 5</strong> from 500+ reviews · Trusted since 2019</div>
                </div>
            </section>

            {/* 8. NEWSLETTER */}
            <section className="section">
                <div className="container">
                    <div className="newsletter fade-in">
                        <h3>Join the Tea Circle</h3>
                        <p>Get early access to new arrivals, brewing tips, and 10% off your first order.</p>
                        <form className="newsletter__form" onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing!'); }}>
                            <input type="email" placeholder="Your email address" required aria-label="Email address" />
                            <button type="submit">Subscribe</button>
                        </form>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
