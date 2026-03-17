'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import ProductGridSkeleton from '../components/ProductGridSkeleton';
import SectionHeader from '../components/SectionHeader';
import { useCart } from '../context/CartContext';
import { renderStars } from '../utils/renderStars';

type HomeProduct = {
    id: string;
    slug: string;
    name: string;
    type: string;
    price: number;
    img: string;
    note: string;
    reviews: number;
    stars: number;
    inStock: boolean;
    typeName?: string;
    badge?: string | null;
    badgeColor?: string;
};

type HomeTestimonial = {
    _id: string;
    text: string;
    author: string;
    role: string;
    rating: number;
};

type NewsletterStatus = {
    text: string;
    type: '' | 'success' | 'error';
};

export default function Home() {
    const [activeTab, setActiveTab] = useState('new');
    const { addToCart } = useCart();
    const [nlStatus, setNlStatus] = useState<NewsletterStatus>({ text: '', type: '' });

    const [newArrivals, setNewArrivals] = useState<HomeProduct[]>([]);
    const [bestSellers, setBestSellers] = useState<HomeProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Testimonials from API
    const [testimonials, setTestimonials] = useState<HomeTestimonial[]>([]);
    const fallbackTestimonials: HomeTestimonial[] = [
        { _id: '1', text: 'The Darjeeling First Flush is absolutely divine. It\'s like sipping on liquid sunshine — delicate, fragrant, and utterly refreshing. Best tea I\'ve had in years.', author: 'Priya Sharma', role: 'Tea Enthusiast, Mumbai', rating: 5 },
        { _id: '2', text: 'I ordered the Wellness Ritual gift box for my mother and she was overjoyed. The packaging is gorgeous and the teas are exceptionally fresh. Will order again!', author: 'Arjun Mehta', role: 'Repeat Customer, Delhi', rating: 5 },
        { _id: '3', text: 'Their Heritage Spiced Chai has replaced my morning coffee entirely. The blend of spices is perfectly balanced — warm but never overwhelming. An everyday essential.', author: 'Kavya Nair', role: 'Wellness Coach, Bangalore', rating: 5 },
        { _id: '4', text: 'As a café owner, I switched to Feelinga for our premium tea menu. Our customers immediately noticed the quality difference. Exceptional sourcing and consistency.', author: 'Rohan Desai', role: 'Café Owner, Pune', rating: 5 },
    ];

    // Animated counter hook
    const useCounter = (target: number, suffix = ''): { count: string; start: () => void } => {
        const [count, setCount] = useState(0);
        const [started, setStarted] = useState(false);
        useEffect(() => {
            if (!started) return;
            let start = 0;
            const duration = 2000;
            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setCount(Math.floor(eased * target));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, [started, target]);
        return { count: count + suffix, start: () => setStarted(true) };
    };

    const estates = useCounter(15, '+');
    const varieties = useCounter(50, '+');
    const sippers = useCounter(10, 'K+');

    // Trigger counters when story section is visible
    useEffect(() => {
        const el = document.getElementById('story-stats');
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                estates.start();
                varieties.start();
                sippers.start();
                obs.disconnect();
            }
        }, { threshold: 0.3 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const [newRes, bestRes] = await Promise.all([
                    fetch('/api/v1/products?limit=4&isNewArrival=true&sort=-createdAt'),
                    fetch('/api/v1/products?limit=4&isBestSeller=true&sort=-reviewCount'),
                ]);
                const newData = await newRes.json().catch(() => ({}));
                let bestData = await bestRes.json().catch(() => ({}));

                // Fallback: if no products are flagged as best sellers, use top-rated
                if (!bestData.data || bestData.data.length === 0) {
                    const fallbackRes = await fetch('/api/v1/products?limit=4&sort=-rating');
                    bestData = await fallbackRes.json().catch(() => ({}));
                }

                const mapProduct = (p: any): HomeProduct => ({
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

    // Fetch approved testimonials
    useEffect(() => {
        async function fetchTestimonials() {
            try {
                const res = await fetch('/api/v1/testimonials');
                const data = await res.json().catch(() => ({}));
                if (data.data && data.data.length > 0) {
                    setTestimonials(data.data);
                } else {
                    setTestimonials(fallbackTestimonials);
                }
            } catch {
                setTestimonials(fallbackTestimonials);
            }
        }
        fetchTestimonials();
    }, []);

    const handleAddToCart = (p: HomeProduct) => {
        addToCart({ id: p.id, slug: p.slug, name: p.name, price: p.price, size: '100g', img: p.img });
    };
    const seasonalGifts: HomeProduct[] = [
        { id: 'gift-spring-festival-box', slug: 'gift-spring-festival-box', name: 'Spring Festival Tea Box', type: 'Gift Collection', price: 1499, img: '/images/gift-box.png', note: '5 curated teas in a premium gift box', reviews: 45, stars: 5, inStock: true },
        { id: 'gift-wellness-ritual-box', slug: 'gift-wellness-ritual-box', name: 'Wellness Ritual Box', type: 'Gift Collection', price: 999, img: '/images/gift-box.png', note: '3 wellness blends with infuser', reviews: 67, stars: 5, inStock: true },
        { id: 'gift-connoisseurs-collection', slug: 'gift-connoisseurs-collection', name: "Connoisseur's Collection", type: 'Luxury Hamper', price: 3999, img: '/images/gift-box.png', note: '8 rare teas with teaware in wooden chest', reviews: 28, stars: 5, inStock: true },
        { id: 'gift-tea-honey-pairing-set', slug: 'gift-tea-honey-pairing-set', name: 'Tea & Honey Pairing Set', type: 'Gift Collection', price: 799, img: '/images/herbal-tea.png', note: '2 teas paired with artisanal honey', reviews: 34, stars: 4, inStock: true },
    ];

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
                    <div className="hero__decor-inner"><Image src="/images/tea-lifestyle.png" alt="Tea ritual" width={400} height={400} className="hero-decor-img" priority /></div>
                </div>
            </section>

            {/* 2. SHOP BY MOOD */}
            <section className="section" id="moods">
                <div className="container">
                    <SectionHeader
                        className="fade-in"
                        overline="Find Your Blend"
                        title="Shop by Mood"
                        description="Let your mood guide you to the perfect cup."
                    />
                    <div className="mood-grid fade-in" style={{ '--stagger': '0.1s' } as any}>
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
                    <SectionHeader
                        className="fade-in"
                        overline="Our Collection"
                        title="Discover Our Teas"
                    />
                    <div className="commerce-tabs fade-in" role="tablist">
                        {[{ key: 'new', label: 'New Arrivals' }, { key: 'best', label: 'Best Sellers' }, { key: 'seasonal', label: 'Seasonal Gifts' }].map(t => (
                            <button key={t.key} className={`commerce-tab ${activeTab === t.key ? 'active' : ''}`} role="tab" id={`htab-${t.key}`} aria-selected={activeTab === t.key} aria-controls={`hpanel-${t.key}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                        ))}
                    </div>

                    {loadingProducts ? (
                        <ProductGridSkeleton />
                    ) : (
                        <>
                            {/* New Arrivals */}
                            <div role="tabpanel" id="hpanel-new" aria-labelledby="htab-new" className={`product-grid tab-panel ${activeTab === 'new' ? 'tab-panel--active' : 'product-grid--hidden'}`}>
                                {newArrivals.length === 0 ? (
                                    <p className="tab-panel__empty">No new arrivals at the moment. <Link href="/shop">Browse all teas</Link></p>
                                ) : newArrivals.map(p => (
                                    <ProductCard
                                        key={p.id}
                                        product={p}
                                        badge="New"
                                        renderStars={renderStars}
                                        onAdd={handleAddToCart}
                                    />
                                ))}
                            </div>

                            {/* Best Sellers */}
                            <div role="tabpanel" id="hpanel-best" aria-labelledby="htab-best" className={`product-grid tab-panel ${activeTab === 'best' ? 'tab-panel--active' : 'product-grid--hidden'}`}>
                                {bestSellers.length === 0 ? (
                                    <p className="tab-panel__empty">Check back soon for our top picks. <Link href="/shop">Browse all teas</Link></p>
                                ) : bestSellers.map(p => (
                                    <ProductCard
                                        key={p.id}
                                        product={p}
                                        badge="Best Seller"
                                        badgeClass="product-card__badge--gold"
                                        renderStars={renderStars}
                                        onAdd={handleAddToCart}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Seasonal Gifts — static */}
                    <div role="tabpanel" id="hpanel-seasonal" aria-labelledby="htab-seasonal" className={`product-grid tab-panel ${activeTab === 'seasonal' ? 'tab-panel--active' : 'product-grid--hidden'}`}>
                        {seasonalGifts.map((p, i) => (
                            <ProductCard
                                key={i}
                                product={p}
                                badge="Gift Set"
                                badgeClass="product-card__badge--success"
                                renderStars={renderStars}
                                linkHref="/gifting"
                                footer={
                                    <Link href="/gifting" className="btn btn--ghost btn--sm btn-block mt-12">View Gift Sets</Link>
                                }
                            />
                        ))}
                    </div>

                    <div className="text-center mt-2xl">
                        <Link href="/shop" className="btn btn--secondary">View All Teas</Link>
                    </div>
                </div>
            </section>

            {/* 4. TEA MASTER'S SELECTIONS */}
            <section className="section">
                <div className="container">
                    <SectionHeader
                        className="fade-in"
                        overline="Expert Curated"
                        title="Tea Master&apos;s Selections"
                        description="Hand-picked by our master taster for exceptional quality and character."
                    />
                    <div className="curated-grid scale-in">
                        {[
                            { name: 'First Flush Darjeeling', img: '/images/darjeeling-tea.png', desc: '"The champagne of teas — this spring harvest delivers an exquisite muscatel aroma with a light, floral body."', meta: '₹1,299 · Limited Edition', slug: 'darjeeling-first-flush' },
                            { name: 'Silver Needle White', img: '/images/white-tea.png', desc: '"Rare, hand-plucked buds with the most delicate sweetness. Best enjoyed in quiet afternoon solitude."', meta: '₹1,899 · Single Estate', slug: 'silver-needle-white' },
                            { name: 'Aged Pu-erh Reserve', img: '/images/oolong-tea.png', desc: '"Deep, earthy complexity with a smooth, velvety finish. A meditative tea for the true connoisseur."', meta: '₹2,499 · Rare Find', slug: null },
                        ].map((c, i) => (
                            <div className="curated-card" key={i}>
                                <div className="curated-card__img"><Image src={c.img} alt={c.name} width={400} height={300} className="img-cover-rounded-md" /></div>
                                <div className="curated-card__body">
                                    <h4>{c.name}</h4>
                                    <p>{c.desc}</p>
                                    <div className="curated-card__meta">{c.meta}</div>
                                    {c.slug && <Link href={`/product/${c.slug}`} className="btn btn--ghost btn--sm mt-sm">View Details</Link>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. STORY & ORIGIN */}
            <section className="section section--alt">
                <div className="container">
                    <div className="story-grid">
                        <div className="story__content slide-in-left">
                            <p className="overline">Our Story</p>
                            <h2>Born from a Love of Ritual</h2>
                            <p>Feelinga began with a simple belief: that a cup of tea can be a moment of mindfulness in a busy world. We partner directly with small-estate growers across Darjeeling, Assam, and the Nilgiris to bring you teas that are as kind to the earth as they are to your senses.</p>
                            <div className="story__stats" id="story-stats">
                                <div><div className="story__stat-value">{estates.count}</div><div className="story__stat-label">Partner Estates</div></div>
                                <div><div className="story__stat-value">{varieties.count}</div><div className="story__stat-label">Tea Varieties</div></div>
                                <div><div className="story__stat-value">{sippers.count}</div><div className="story__stat-label">Happy Sippers</div></div>
                            </div>
                            <div className="mt-xl">
                                <Link href="/about" className="btn btn--ghost">Learn More About Us</Link>
                            </div>
                        </div>
                        <div className="story__visual slide-in-right">
                            <Image src="/images/hero-estate.png" alt="Mist-covered tea gardens" width={600} height={400} className="img-cover-rounded-lg" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. LEARN THE ART OF TEA */}
            <section className="section">
                <div className="container">
                    <SectionHeader
                        className="fade-in"
                        overline="Knowledge"
                        title="Learn the Art of Tea"
                        description="Explore guides, stories, and brewing wisdom from our experts."
                    />
                    <div className="guide-grid fade-in" style={{ '--stagger': '0.15s' } as any}>
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
                    <SectionHeader overline="Reviews" title="What Our Sippers Say" className="fade-in" />
                    <div className="testimonials-wrapper">
                        <button className="testimonials-arrow testimonials-arrow--left" aria-label="Scroll left" onClick={() => { const track = document.querySelector('.testimonials-track'); if (track) track.scrollBy({ left: -400, behavior: 'smooth' }); }}>&#8249;</button>
                        <div className="testimonials-track blur-in">
                            {(testimonials.length > 0 ? testimonials : fallbackTestimonials).map((t, i) => (
                                <div className="testimonial-card" key={t._id || i}>
                                    <div className="testimonial-card__stars">{'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}</div>
                                    <div className="testimonial-card__text">"{t.text}"</div>
                                    <div className="testimonial-card__author">{t.author}</div>
                                    <div className="testimonial-card__role">{t.role}</div>
                                </div>
                            ))}
                        </div>
                        <button className="testimonials-arrow testimonials-arrow--right" aria-label="Scroll right" onClick={() => { const track = document.querySelector('.testimonials-track'); if (track) track.scrollBy({ left: 400, behavior: 'smooth' }); }}>&#8250;</button>
                    </div>
                    <div className="testimonials__summary fade-in"><strong>4.8 / 5</strong> from 500+ reviews · Trusted since 2019</div>
                </div>
            </section>

            {/* 8. NEWSLETTER */}
            <section className="section">
                <div className="container">
                    <div className="newsletter scale-in">
                        <h3>Join the Tea Circle</h3>
                        <p>Get early access to new arrivals, brewing tips, and 10% off your first order.</p>
                        <form className="newsletter__form" onSubmit={async (e) => {
                            e.preventDefault();
                            const email = (e.target as any).elements[0].value.trim();
                            try {
                                const res = await fetch('/api/v1/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                                const data = await res.json().catch(() => ({}) as any);
                                if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
                                setNlStatus({ text: data.message || 'Subscribed!', type: 'success' });
                                (e.target as any).reset();
                            } catch (err: any) {
                                setNlStatus({ text: err.message || 'Failed to subscribe', type: 'error' });
                            }
                        }}>
                            <input type="email" placeholder="Your email address" required aria-label="Email address" />
                            <button type="submit">Subscribe</button>
                        </form>
                        {nlStatus.text && <p className={`mt-sm text-0-9 ${nlStatus.type === 'success' ? 'text-success' : 'text-error'}`}>{nlStatus.text}</p>}
                    </div>
                </div>
            </section>
        </Layout>
    );
}
