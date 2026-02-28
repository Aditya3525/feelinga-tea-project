'use client';
import Layout from '../../../components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Toast';
import { apiRequest } from '../../../utils/api';

export default function ProductDetail() {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSize, setSelectedSize] = useState('100g');
    const [qty, setQty] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [wishlisted, setWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('description');

    // Related products
    const [related, setRelated] = useState([]);

    const { addToCart } = useCart();
    const { isAuthenticated, openAuthModal } = useAuth();
    const { showToast } = useToast();

    // Dynamic document title & JSON-LD structured data
    useEffect(() => {
        if (!product) return;
        document.title = `${product.name} — Premium ${product.type} | feelinga`;
        const meta = document.querySelector('meta[name="description"]');
        const desc = product.shortDescription || (product.description ? product.description.substring(0, 160) : '');
        if (meta) meta.setAttribute('content', desc);
        else {
            const m = document.createElement('meta');
            m.name = 'description';
            m.content = desc;
            document.head.appendChild(m);
        }

        // JSON-LD Product schema
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.shortDescription || product.description,
            image: product.images?.[0] || '',
            sku: product.slug,
            brand: { '@type': 'Brand', name: 'feelinga' },
            offers: {
                '@type': 'Offer',
                priceCurrency: 'INR',
                price: product.prices?.['100g'] || 0,
                availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                url: typeof window !== 'undefined' ? window.location.href : '',
            },
            ...(product.rating && product.reviewCount > 0 ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: product.rating,
                    reviewCount: product.reviewCount,
                },
            } : {}),
        };
        let script = document.getElementById('product-jsonld') as HTMLScriptElement;
        if (!script) {
            script = document.createElement('script');
            script.id = 'product-jsonld';
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(jsonLd);

        return () => {
            document.title = 'feelinga — happiness is here';
            const el = document.getElementById('product-jsonld');
            if (el) el.remove();
        };
    }, [product]);

    useEffect(() => {
        async function fetchProduct() {
            try {
                setLoading(true);
                const res = await fetch(`/api/v1/products/${slug}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Product not found');
                setProduct(data.data);
                // Set default size to first available
                const sizes = Object.entries(data.data.prices || {}).filter(([, v]) => v);
                if (sizes.length > 0) setSelectedSize(sizes[0][0]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        if (slug) fetchProduct();
    }, [slug]);

    // Check if product is already wishlisted
    useEffect(() => {
        if (!product || !isAuthenticated) return;
        async function checkWishlist() {
            try {
                const data = await apiRequest('/auth/wishlist');
                const ids = (data.data || []).map(p => p._id || p);
                setWishlisted(ids.includes(product._id));
            } catch { /* silent */ }
        }
        checkWishlist();
    }, [product, isAuthenticated]);

    const toggleWishlist = async () => {
        if (!isAuthenticated) { openAuthModal(); return; }
        if (wishlistLoading) return;
        setWishlistLoading(true);
        try {
            const data = await apiRequest(`/auth/wishlist/${product._id}`, { method: 'POST' });
            setWishlisted(data.action === 'added');
            showToast(data.action === 'added' ? '❤️ Added to wishlist' : 'Removed from wishlist', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setWishlistLoading(false);
        }
    };

    useEffect(() => {
        if (!product) return;

        // Fetch reviews
        async function fetchReviews() {
            setReviewsLoading(true);
            try {
                const res = await fetch(`/api/v1/reviews?productId=${product._id}&limit=10`);
                const data = await res.json();
                setReviews(data.data || []);
            } catch { /* silent */ } finally {
                setReviewsLoading(false);
            }
        }

        // Fetch related products (same type, different slug)
        async function fetchRelated() {
            try {
                const res = await fetch(`/api/v1/products?type=${encodeURIComponent(product.type)}&limit=4`);
                const data = await res.json();
                setRelated((data.data || []).filter(p => p.slug !== slug).slice(0, 3));
            } catch { /* silent */ }
        }

        fetchReviews();
        fetchRelated();
    }, [product, slug]);

    const handleAddToCart = () => {
        for (let i = 0; i < qty; i++) {
            addToCart({
                id: product._id,
                slug: product.slug,
                name: product.name,
                price: currentPrice,
                size: selectedSize,
                img: product.images?.[0] || '/images/darjeeling-tea.png',
            });
        }
        showToast(`${product.name} (${selectedSize}) added to cart!`, 'success');
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) { openAuthModal(); return; }
        setReviewSubmitting(true);
        try {
            const data = await apiRequest('/reviews', {
                method: 'POST',
                body: JSON.stringify({ productId: product._id, ...reviewForm }),
            });
            setReviews(prev => [data.data, ...prev]);
            setReviewForm({ rating: 5, title: '', body: '' });
            showToast('Review posted!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const renderStars = (rating: number, interactive = false, onChange?: (n: number) => void) => {
        return (
            <span style={{ fontSize: '1.1rem', letterSpacing: 2, cursor: interactive ? 'pointer' : 'default' }}>
                {[1, 2, 3, 4, 5].map(n => (
                    <span
                        key={n}
                        style={{ color: n <= rating ? '#d4a017' : '#ccc' }}
                        onClick={interactive ? () => onChange(n) : undefined}
                    >★</span>
                ))}
            </span>
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="container section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3xl)', padding: 'var(--space-3xl) 0' }}>
                    {/* Skeleton */}
                    <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', height: 400 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div style={{ height: 14, width: '30%', background: 'var(--color-border)', borderRadius: 4 }} />
                        <div style={{ height: 36, width: '80%', background: 'var(--color-border)', borderRadius: 4 }} />
                        <div style={{ height: 14, width: '40%', background: 'var(--color-border)', borderRadius: 4 }} />
                        <div style={{ height: 80, background: 'var(--color-border)', borderRadius: 4, marginTop: 'var(--space-md)' }} />
                        <div style={{ height: 48, background: 'var(--color-border)', borderRadius: 4, marginTop: 'var(--space-md)' }} />
                    </div>
                </div>
            </Layout>
        );
    }

    if (error || !product) {
        return (
            <Layout>
                <div className="container section" style={{ textAlign: 'center', padding: 'var(--space-4xl) 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🍵</div>
                    <h2>Product Not Found</h2>
                    <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>{error || 'This tea could not be found.'}</p>
                    <Link href="/shop" className="btn btn--primary" style={{ marginTop: 'var(--space-xl)', display: 'inline-block' }}>Browse All Teas</Link>
                </div>
            </Layout>
        );
    }

    const currentPrice = product.prices?.[selectedSize] || product.prices?.['100g'] || 0;
    const availableSizes = product.prices ? Object.entries(product.prices).filter(([, v]) => v) as [string, number][] : [];
    const avgRating = reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) : null;

    return (
        <Layout>
            {/* Breadcrumb */}
            <div className="page-hero" style={{ paddingBottom: 'var(--space-md)' }}>
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link href="/">Home</Link> <span>/</span> <Link href="/shop">Shop</Link> <span>/</span> <span>{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* Main PDP */}
            <div className="container">
                <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3xl)', alignItems: 'start' }}>
                    {/* Image Panel */}
                    <div className="pdp-gallery">
                        <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            <Image
                                src={product.images?.[selectedImage] || product.images?.[0] || '/images/darjeeling-tea.png'}
                                alt={product.name}
                                width={420}
                                height={420}
                                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', transition: 'transform 0.4s ease' }}
                                priority
                            />
                            {/* Wishlist button */}
                            <button
                                className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
                                onClick={toggleWishlist}
                                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                                style={{ position: 'absolute', top: 12, right: 12 }}
                            >
                                {wishlisted ? '❤️' : '🤍'}
                            </button>
                        </div>
                        {/* Thumbnail gallery */}
                        {product.images?.length > 1 && (
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', overflowX: 'auto' }}>
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        style={{
                                            width: 64, height: 64, borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                            border: selectedImage === i ? '2px solid var(--color-accent)' : '2px solid var(--color-border)',
                                            background: 'var(--color-bg-alt)', cursor: 'pointer', padding: 4, flexShrink: 0,
                                            opacity: selectedImage === i ? 1 : 0.7, transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <Image src={img} alt={`${product.name} view ${i + 1}`} width={56} height={56} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* Mood + Stock tags */}
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                            {!product.inStock && <span style={{ background: '#e74c3c', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>Out of Stock</span>}
                            {product.moods?.map(m => (
                                <Link key={m} href={`/shop?mood=${m}`} style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', textTransform: 'capitalize' }}>{m}</Link>
                            ))}
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div className="pdp-info">
                        <div className="product-card__type" style={{ marginBottom: 'var(--space-xs)' }}>{product.type}</div>
                        <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: 'var(--space-sm)' }}>{product.name}</h1>

                        {/* Rating summary */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                            {renderStars(Math.round(product.rating || 0))}
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                {product.rating ? `${Number(product.rating).toFixed(1)} ` : ''} ({product.reviewCount || 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                        </div>

                        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--color-text-muted)', lineHeight: 1.8 }}>{product.shortDescription || product.description}</p>

                        {/* Size Selector */}
                        {availableSizes.length > 0 && (
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Select Size</label>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                    {availableSizes.map(([size, price]) => (
                                        <button
                                            key={size}
                                            className={`btn btn--sm ${selectedSize === size ? 'btn--primary' : 'btn--ghost'}`}
                                            onClick={() => setSelectedSize(size)}
                                        >
                                            {size} — ₹{price}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                            <label style={{ fontWeight: 600 }}>Qty</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 12px' }}>
                                <button style={{ fontWeight: 700, padding: '0 4px' }} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                                <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                                <button style={{ fontWeight: 700, padding: '0 4px' }} onClick={() => setQty(qty + 1)}>+</button>
                            </div>
                        </div>

                        {/* Price + CTA */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
                            <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>₹{(currentPrice * qty).toLocaleString()}</div>
                            <button
                                className="btn btn--primary"
                                style={{ flex: 1, fontSize: '1rem', padding: '14px 24px' }}
                                onClick={handleAddToCart}
                                disabled={!product.inStock}
                            >
                                {product.inStock ? '🛒  Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>

                        {/* Highlights */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', fontSize: '0.9rem' }}>
                            {product.origin && <div><strong>🗺 Origin</strong><br />{product.origin}</div>}
                            {product.caffeine && <div><strong>☕ Caffeine</strong><br /><span style={{ textTransform: 'capitalize' }}>{product.caffeine}</span></div>}
                            {product.tastingNotes?.length > 0 && <div style={{ gridColumn: '1 / -1' }}><strong>👅 Tasting Notes</strong><br />{product.tastingNotes.join(' · ')}</div>}
                        </div>

                        {/* Low stock warning */}
                        {product.inStock && product.stock > 0 && product.stock <= 10 && (
                            <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: '#fff8e1', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #f9a825', fontSize: '0.9rem', fontWeight: 600, color: '#e65100' }}>
                                ⚡ Only {product.stock} left — order soon!
                            </div>
                        )}

                        {/* Benefits badges */}
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', flexWrap: 'wrap' }}>
                            {['Free shipping over ₹999', '100% Natural', 'Garden Fresh'].map(b => (
                                <span key={b} style={{ fontSize: '0.78rem', padding: '4px 10px', border: '1px solid var(--color-border)', borderRadius: 20, color: 'var(--color-text-muted)' }}>✓ {b}</span>
                            ))}
                        </div>

                        {/* Social Sharing */}
                        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Share:</span>
                            <button
                                onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name} on feelinga! ${window.location.href}`)}`, '_blank')}
                                style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #25d366', background: '#25d366', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                aria-label="Share on WhatsApp"
                            >WhatsApp</button>
                            <button
                                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')}
                                style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #1877f2', background: '#1877f2', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                aria-label="Share on Facebook"
                            >Facebook</button>
                            <button
                                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${product.name} — premium tea from feelinga 🍵`)}&url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')}
                                style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid #000', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                aria-label="Share on X (Twitter)"
                            >𝕏 Post</button>
                            <button
                                onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                                style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                aria-label="Copy link"
                            >🔗 Copy Link</button>
                        </div>
                    </div>
                </div>

                {/* Tabs: Description / Brewing / Reviews */}
                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-2xl)' }}>
                    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)' }}>
                        {['description', 'brewing', 'reviews'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: 'var(--space-md) var(--space-xl)',
                                    fontWeight: activeTab === tab ? 700 : 400,
                                    borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontSize: '0.95rem',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {tab === 'reviews' ? `Reviews (${reviews.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Description Tab */}
                    {activeTab === 'description' && (
                        <div style={{ padding: 'var(--space-2xl) 0', maxWidth: 700 }}>
                            <p style={{ lineHeight: 1.9, color: 'var(--color-text-muted)' }}>{product.description}</p>
                            {product.origin && (
                                <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                                    <strong>About the Origin</strong>
                                    <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                                        Sourced from {product.origin} — one of India&apos;s premier tea-growing regions, known for its unique terroir and expert craftsmanship.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Brewing Tab */}
                    {activeTab === 'brewing' && (
                        <div style={{ padding: 'var(--space-2xl) 0' }}>
                            {product.brewingInstructions ? (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', maxWidth: 600, marginBottom: 'var(--space-2xl)' }}>
                                        {[
                                            { icon: '🌡️', label: 'Temperature', val: product.brewingInstructions.temperature },
                                            { icon: '⏱️', label: 'Steep Time', val: product.brewingInstructions.steepTime },
                                            { icon: '🥄', label: 'Amount', val: product.brewingInstructions.amount },
                                        ].filter(x => x.val).map(x => (
                                            <div key={x.label} style={{ textAlign: 'center', padding: 'var(--space-lg)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ fontSize: '1.8rem', marginBottom: 'var(--space-xs)' }}>{x.icon}</div>
                                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{x.label}</div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{x.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {product.brewingInstructions.steps?.length > 0 && (
                                        <div>
                                            <h3 style={{ marginBottom: 'var(--space-md)' }}>Step-by-Step Guide</h3>
                                            <ol style={{ paddingLeft: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                                {product.brewingInstructions.steps.map((step, i) => (
                                                    <li key={i} style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--color-text-muted)', padding: 'var(--space-2xl) 0' }}>
                                    <p>Brewing guide not available for this tea yet.</p>
                                    <p style={{ marginTop: 'var(--space-md)' }}>General tip: Start with 85–95°C water and steep for 2–4 minutes depending on your taste preference.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div style={{ padding: 'var(--space-2xl) 0' }}>
                            {/* Rating Summary */}
                            {reviews.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xl)', marginBottom: 'var(--space-2xl)', padding: 'var(--space-xl)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>{avgRating?.toFixed(1)}</div>
                                        <div style={{ marginTop: 'var(--space-xs)' }}>{renderStars(Math.round(avgRating || 0))}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{reviews.length} reviews</div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = reviews.filter(r => r.rating === star).length;
                                            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                            return (
                                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.85rem' }}>
                                                    <span style={{ minWidth: 20 }}>{star}★</span>
                                                    <div style={{ flex: 1, height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${pct}%`, background: '#d4a017', borderRadius: 4, transition: 'width 0.6s ease' }} />
                                                    </div>
                                                    <span style={{ minWidth: 24, color: 'var(--color-text-muted)' }}>{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Write a Review */}
                            <div style={{ marginBottom: 'var(--space-2xl)', padding: 'var(--space-xl)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                                <h3 style={{ marginBottom: 'var(--space-lg)' }}>Write a Review</h3>
                                {isAuthenticated ? (
                                    <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>Your Rating</label>
                                            {renderStars(reviewForm.rating, true, (n) => setReviewForm(f => ({ ...f, rating: n })))}
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>Title <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span></label>
                                            <input
                                                type="text" maxLength={100} placeholder="Summarise your experience"
                                                value={reviewForm.title}
                                                onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                                                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>Review <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span></label>
                                            <textarea
                                                rows={4} maxLength={1000} placeholder="Share your experience with this tea..."
                                                value={reviewForm.body}
                                                onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                                                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div>
                                            <button type="submit" className="btn btn--primary" disabled={reviewSubmitting}>
                                                {reviewSubmitting ? '⏳ Posting...' : 'Post Review'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0', color: 'var(--color-text-muted)' }}>
                                        <p>Please <button className="btn btn--ghost btn--sm" onClick={openAuthModal}>sign in</button> to leave a review.</p>
                                    </div>
                                )}
                            </div>

                            {/* Review List */}
                            {reviewsLoading ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Loading reviews...</div>
                            ) : reviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>
                                    <p>No reviews yet. Be the first to share your experience!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                    {reviews.map(review => (
                                        <div key={review._id} style={{ padding: 'var(--space-lg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                                <div>
                                                    {renderStars(review.rating)}
                                                    {review.title && <div style={{ fontWeight: 600, marginTop: 4 }}>{review.title}</div>}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    {review.user?.name || 'Anonymous'} · {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                            {review.body && <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{review.body}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Related Products */}
            {related.length > 0 && (
                <section className="section section--alt">
                    <div className="container">
                        <div className="section-header">
                            <p className="overline">You May Also Like</p>
                            <h2>More {product.type}</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', marginTop: 'var(--space-2xl)' }}>
                            {related.map(p => (
                                <div className="product-card" key={p._id}>
                                    <Link href={`/product/${p.slug}`}>
                                        <div className="product-card__img">
                                            <Image src={p.images?.[0] || '/images/darjeeling-tea.png'} alt={p.name} width={300} height={300} style={{ objectFit: 'contain', width: '100%', height: 'auto' }} />
                                        </div>
                                    </Link>
                                    <div className="product-card__body">
                                        <div className="product-card__type">{p.type}</div>
                                        <Link href={`/product/${p.slug}`} className="product-card__name">{p.name}</Link>
                                        <div className="product-card__note">{p.shortDescription || ''}</div>
                                        <div className="product-card__bottom">
                                            <div className="product-card__price">₹{p.prices?.['100g']?.toLocaleString() || '—'}</div>
                                            <div className="product-card__rating">{'★'.repeat(Math.round(p.rating || 5))} <span>({p.reviewCount || 0})</span></div>
                                        </div>
                                        <Link href={`/product/${p.slug}`} className="btn btn--ghost btn--sm" style={{ width: '100%', textAlign: 'center', marginTop: 12 }}>View Details</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </Layout>
    );
}
