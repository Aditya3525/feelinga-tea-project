'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useCart } from '../context/CartContext';

export default function Home() {
    const [activeTab, setActiveTab] = useState('new');
    const { addToCart } = useCart();

    const [newArrivals, setNewArrivals] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const [newRes, bestRes] = await Promise.all([
                    fetch('/api/v1/products?limit=4&sort=-createdAt'),
                    fetch('/api/v1/products?limit=4&sort=-reviewCount'),
                ]);
                const newData = await newRes.json();
                const bestData = await bestRes.json();

                const mapProduct = (p) => ({
                    id: p._id,
                    slug: p.slug,
                    name: p.name,
                    type: p.type,
                    price: p.prices?.['100g'] || 0,
                    img: p.images?.[0] || '/images/darjeeling-tea.png',
                    note: p.shortDescription || (p.description ? p.description.substring(0, 60) + '...' : ''),
                    reviews: p.reviewCount || 0,
                    stars: Math.round(p.rating || 0) || 5,
                    inStock: p.inStock,
                });

                if (newData.data) setNewArrivals(newData.data.map(mapProduct));
                if (bestData.data) setBestSellers(bestData.data.map(mapProduct));
            } catch (err) {
                console.error('Failed to load homepage products:', err);
            } finally {
                setLoadingProducts(false);
            }
        }
        fetchProducts();
    }, []);

    const handleAddToCart = (p) => {
        addToCart({ id: p.id, slug: p.slug, name: p.name, price: p.price, size: '100g', img: p.img });
    };

    const renderStars = (count) => '★'.repeat(count) + (count < 5 ? '☆'.repeat(5 - count) : '');

    const ProductCard = ({ p, badge, badgeStyle }) => (
        <div className="product-card">
            {badge && <span className="product-card__badge" style={badgeStyle}>{badge}</span>}
            <Link href={`/product/${p.slug}`}>
                <div className="product-card__img"><img src={p.img} alt={`${p.name} tea`} /></div>
            </Link>
            <div className="product-card__body">
                <div className="product-card__type">{p.type}</div>
                <Link href={`/product/${p.slug}`} className="product-card__name">{p.name}</Link>
                <div className="product-card__note">{p.note}</div>
                <div className="product-card__bottom">
                    <div className="product-card__price">₹{p.price.toLocaleString()}</div>
                    <div className="product-card__rating">{renderStars(p.stars)} <span>({p.reviews})</span></div>
                </div>
                <button className="btn btn--primary btn--sm" style={{ width: '100%', marginTop: '12px' }} onClick={() => handleAddToCart(p)} disabled={!p.inStock}>
                    {p.inStock ? 'Add to Cart' : 'Sold Out'}
                </button>
            </div>
        </div>
    );

    const seasonalGifts = [
        { name: 'Spring Festival Tea Box', type: 'Gift Collection', price: 1499, img: '/images/gift-box.png', note: '5 curated teas in a premium gift box', reviews: 45, stars: 5 },
        { name: 'Wellness Ritual Box', type: 'Gift Collection', price: 999, img: '/images/gift-box.png', note: '3 wellness blends with infuser', reviews: 67, stars: 5 },
        { name: "Connoisseur's Collection", type: 'Luxury Hamper', price: 3999, img: '/images/gift-box.png', note: '8 rare teas with teaware in wooden chest', reviews: 28, stars: 5 },
        { name: 'Tea & Honey Pairing Set', type: 'Gift Collection', price: 799, img: '/images/herbal-tea.png', note: '2 teas paired with artisanal honey', reviews: 34, stars: 4 },
    ];

    const LoadingSkeleton = () => (
        <div className="product-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="product-card" style={{ background: 'var(--color-bg-alt)', minHeight: 320, overflow: 'hidden' }}>
                    <div style={{ height: 220, background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-bg) 50%, var(--color-border) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 'var(--radius-md)', margin: 'var(--space-md)' }} />
                    <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ height: 12, background: 'var(--color-border)', borderRadius: 4, width: '40%', animation: 'shimmer 1.4s infinite', animationDelay: '0.1s' }} />
                        <div style={{ height: 18, background: 'var(--color-border)', borderRadius: 4, width: '80%', animation: 'shimmer 1.4s infinite', animationDelay: '0.2s' }} />
                        <div style={{ height: 12, background: 'var(--color-border)', borderRadius: 4, width: '60%', animation: 'shimmer 1.4s infinite', animationDelay: '0.3s' }} />
                    </div>
                </div>
            ))}
        </div>
    );

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
                            { mood: 'energize', icon: '⚡', title: 'Energize', desc: "Start your day with vibrant, uplifting blends." },
                            { mood: 'relax', icon: '🌿', title: 'Relax', desc: "Soothing teas that melt away the day's stress." },
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

                    {loadingProducts ? (
                        <LoadingSkeleton />
                    ) : (
                        <>
                            {/* New Arrivals */}
                            <div className="product-grid fade-in" style={{ display: activeTab === 'new' ? '' : 'none' }}>
                                {newArrivals.map(p => <ProductCard key={p.id} p={p} badge="New" />)}
                            </div>

                            {/* Best Sellers */}
                            <div className="product-grid" style={{ display: activeTab === 'best' ? '' : 'none' }}>
                                {bestSellers.map(p => <ProductCard key={p.id} p={p} badge="Best Seller" badgeStyle={{ background: 'var(--color-gold)' }} />)}
                            </div>
                        </>
                    )}

                    {/* Seasonal Gifts — static */}
                    <div className="product-grid" style={{ display: activeTab === 'seasonal' ? '' : 'none' }}>
                        {seasonalGifts.map((p, i) => (
                            <div className="product-card" key={i}>
                                <span className="product-card__badge" style={{ background: 'var(--color-success)' }}>Gift Set</span>
                                <div className="product-card__img"><img src={p.img} alt={p.name} /></div>
                                <div className="product-card__body">
                                    <div className="product-card__type">{p.type}</div>
                                    <div className="product-card__name">{p.name}</div>
                                    <div className="product-card__note">{p.note}</div>
                                    <div className="product-card__bottom">
                                        <div className="product-card__price">₹{p.price.toLocaleString()}</div>
                                        <div className="product-card__rating">{renderStars(p.stars)} <span>({p.reviews})</span></div>
                                    </div>
                                    <Link href="/gifting" className="btn btn--ghost btn--sm" style={{ width: '100%', marginTop: '12px', textAlign: 'center' }}>View Gift Sets</Link>
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
                            { name: 'First Flush Darjeeling', img: '/images/darjeeling-tea.png', desc: '"The champagne of teas — this spring harvest delivers an exquisite muscatel aroma with a light, floral body."', meta: '₹1,299 · Limited Edition', slug: 'darjeeling-first-flush' },
                            { name: 'Silver Needle White', img: '/images/white-tea.png', desc: '"Rare, hand-plucked buds with the most delicate sweetness. Best enjoyed in quiet afternoon solitude."', meta: '₹1,899 · Single Estate', slug: 'silver-needle-white' },
                            { name: 'Aged Pu-erh Reserve', img: '/images/oolong-tea.png', desc: '"Deep, earthy complexity with a smooth, velvety finish. A meditative tea for the true connoisseur."', meta: '₹2,499 · Rare Find', slug: null },
                        ].map((c, i) => (
                            <div className="curated-card" key={i}>
                                <div className="curated-card__img"><img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /></div>
                                <div className="curated-card__body">
                                    <h4>{c.name}</h4>
                                    <p>{c.desc}</p>
                                    <div className="curated-card__meta">{c.meta}</div>
                                    {c.slug && <Link href={`/product/${c.slug}`} className="btn btn--ghost btn--sm" style={{ marginTop: 'var(--space-sm)' }}>View Details</Link>}
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
