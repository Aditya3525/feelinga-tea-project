'use client';
import Layout from '../../../components/Layout';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Toast';
import ProductGridSkeleton from '../../../components/ProductGridSkeleton';
import EmptyState from '../../../components/EmptyState';
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
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(false);
    const touchStartX = useRef(0);

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
        document.title = `${product.name} — Premium ${product.type} | Feelinga`;
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
            brand: { '@type': 'Brand', name: 'Feelinga' },
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
            document.title = 'Feelinga — happiness is here';
            const el = document.getElementById('product-jsonld');
            if (el) el.remove();
        };
    }, [product]);

    useEffect(() => {
        async function fetchProduct() {
            try {
                setLoading(true);
                const data = await apiRequest(`/products/${slug}`);
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
                const data = await apiRequest(`/reviews?productId=${product._id}&limit=10`);
                setReviews(data.data || []);
            } catch { /* silent */ } finally {
                setReviewsLoading(false);
            }
        }

        // Fetch related products (same type, different slug)
        async function fetchRelated() {
            try {
                const data = await apiRequest(`/products?type=${encodeURIComponent(product.type)}&limit=4`);
                setRelated((data.data || []).filter(p => p.slug !== slug).slice(0, 3));
            } catch { /* silent */ }
        }

        fetchReviews();
        fetchRelated();
    }, [product, slug]);

    const handleAddToCart = () => {
        addToCart({
            id: product._id,
            slug: product.slug,
            name: product.name,
            price: currentPrice,
            size: selectedSize,
            img: product.images?.[0] || '/images/darjeeling-tea.png',
            qty,
        });
        showToast(`${product.name} (${selectedSize}) × ${qty} added to cart!`, 'success');
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
            <span className={`pdp-stars ${interactive ? 'is-interactive' : ''}`}>
                {[1, 2, 3, 4, 5].map(n => (
                    <span
                        key={n}
                        className={`pdp-star ${n <= rating ? 'active' : ''}`}
                        onClick={interactive ? () => onChange(n) : undefined}
                    >★</span>
                ))}
            </span>
        );
    };

    // Lightbox navigation
    const imageCount = product?.images?.length || 0;
    const lightboxNext = useCallback(() => {
        if (imageCount > 1) setSelectedImage(prev => (prev + 1) % imageCount);
    }, [imageCount]);
    const lightboxPrev = useCallback(() => {
        if (imageCount > 1) setSelectedImage(prev => (prev - 1 + imageCount) % imageCount);
    }, [imageCount]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (!lightboxOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setLightboxOpen(false); setLightboxZoom(false); }
            if (e.key === 'ArrowRight') lightboxNext();
            if (e.key === 'ArrowLeft') lightboxPrev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxOpen, lightboxNext, lightboxPrev]);

    if (loading) {
        return (
            <Layout>
                <ProductGridSkeleton variant="pdp" />
            </Layout>
        );
    }

    if (error || !product) {
        return (
            <Layout>
                <div className="container section">
                    <EmptyState
                        icon="🍵"
                        iconSize="lg"
                        title="Product Not Found"
                        message={error || 'This tea could not be found.'}
                        actionLabel="Browse All Teas"
                        actionHref="/shop"
                        className="py-4xl"
                    />
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
            <div className="page-hero page-hero--compact">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link href="/">Home</Link> <span>/</span> <Link href="/shop">Shop</Link> <span>/</span> <span>{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* Main PDP */}
            <div className="container">
                <div className="section pdp-grid">
                    {/* Image Panel */}
                    <div className="pdp-gallery">
                        <div className="pdp-media" style={{ cursor: 'zoom-in' }} onClick={() => setLightboxOpen(true)}>
                            <Image
                                src={product.images?.[selectedImage] || product.images?.[0] || '/images/darjeeling-tea.png'}
                                alt={product.name}
                                width={420}
                                height={420}
                                className="pdp-media__img"
                                priority
                            />
                            {/* Wishlist button */}
                            <button
                                className={`wishlist-btn pdp-wishlist ${wishlisted ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleWishlist(); }}
                                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                            >
                                {wishlisted ? '❤️' : '🤍'}
                            </button>
                        </div>
                        {/* Thumbnail gallery */}
                        {product.images?.length > 1 && (
                            <div className="pdp-thumbs">
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        className={`pdp-thumb ${selectedImage === i ? 'active' : ''}`}
                                    >
                                        <Image src={img} alt={`${product.name} view ${i + 1}`} width={56} height={56} className="pdp-thumb__img" />
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* Mood + Stock tags */}
                        <div className="pdp-tags">
                            {!product.inStock && <span className="tag-pill tag-pill--danger">Out of Stock</span>}
                            {product.moods?.map(m => (
                                <Link key={m} href={`/shop?mood=${m}`} className="tag-pill">{m}</Link>
                            ))}
                        </div>
                    </div>

                    {/* Info Panel */}
                    <div className="pdp-info">
                        <div className="product-card__type pdp-type">{product.type}</div>
                        <h1 className="pdp-title">{product.name}</h1>

                        {/* Rating summary */}
                        <div className="pdp-rating">
                            {renderStars(Math.round(product.rating || 0))}
                            <span className="pdp-rating__meta">
                                {product.rating ? `${Number(product.rating).toFixed(1)} ` : ''} ({product.reviewCount || 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                        </div>

                        <p className="pdp-desc">{product.shortDescription || product.description}</p>

                        {/* Size Selector */}
                        {availableSizes.length > 0 && (
                            <div className="pdp-section">
                                <label className="pdp-label">Select Size</label>
                                <div className="pdp-size-options">
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
                        <div className="pdp-qty">
                            <label className="pdp-label">Qty</label>
                            <div className="pdp-qty-control">
                                <button className="pdp-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                                <span className="pdp-qty-count">{qty}</span>
                                <button className="pdp-qty-btn" onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}>+</button>
                            </div>
                        </div>

                        {/* Price + CTA */}
                        <div className="pdp-price-cta">
                            <div className="pdp-price">₹{(currentPrice * qty).toLocaleString()}</div>
                            <button
                                className="btn btn--primary pdp-cta"
                                onClick={handleAddToCart}
                                disabled={!product.inStock}
                            >
                                {product.inStock ? '🛒  Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>

                        {/* Highlights */}
                        <div className="pdp-highlights">
                            {product.origin && <div><strong>🗺 Origin</strong><br />{product.origin}</div>}
                            {product.caffeine && <div><strong>☕ Caffeine</strong><br /><span className="pdp-text-cap">{product.caffeine}</span></div>}
                            {product.tastingNotes?.length > 0 && <div className="pdp-highlight-full"><strong>👅 Tasting Notes</strong><br />{product.tastingNotes.join(' · ')}</div>}
                        </div>

                        {/* Low stock warning */}
                        {product.inStock && product.stock > 0 && product.stock <= 10 && (
                            <div className="pdp-lowstock">
                                ⚡ Only {product.stock} left — order soon!
                            </div>
                        )}

                        {/* Benefits badges */}
                        <div className="pdp-benefits">
                            {['Free shipping over ₹999', '100% Natural', 'Garden Fresh'].map(b => (
                                <span key={b} className="benefit-pill">✓ {b}</span>
                            ))}
                        </div>

                        {/* Social Sharing */}
                        <div className="pdp-share">
                            <span className="pdp-share__label">Share:</span>
                            <button
                                onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name} on Feelinga! ${window.location.href}`)}`, '_blank')}
                                className="share-btn share-btn--whatsapp"
                                aria-label="Share on WhatsApp"
                            >WhatsApp</button>
                            <button
                                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')}
                                className="share-btn share-btn--facebook"
                                aria-label="Share on Facebook"
                            >Facebook</button>
                            <button
                                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${product.name} — premium tea from Feelinga 🍵`)}&url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')}
                                className="share-btn share-btn--x"
                                aria-label="Share on X (Twitter)"
                            >𝕏 Post</button>
                            <button
                                onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                                className="share-btn"
                                aria-label="Copy link"
                            >🔗 Copy Link</button>
                        </div>
                    </div>
                </div>

                {/* Tabs: Description / Brewing / Reviews */}
                <div className="pdp-tabs">
                    <div className="pdp-tablist" role="tablist" aria-label="Product information">
                        {['description', 'brewing', 'reviews'].map(tab => (
                            <button
                                key={tab}
                                role="tab"
                                id={`pdp-tab-${tab}`}
                                aria-selected={activeTab === tab}
                                aria-controls={`pdp-panel-${tab}`}
                                onClick={() => setActiveTab(tab)}
                                className={`pdp-tab ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab === 'reviews' ? `Reviews (${reviews.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Description Tab */}
                    {activeTab === 'description' && (
                        <div role="tabpanel" id="pdp-panel-description" aria-labelledby="pdp-tab-description" className="pdp-tabpanel pdp-tabpanel--narrow">
                            <p className="pdp-body">{product.description}</p>
                            {product.origin && (
                                <div className="pdp-origin">
                                    <strong>About the Origin</strong>
                                    <p className="pdp-origin__text">
                                        Sourced from {product.origin} — one of India&apos;s premier tea-growing regions, known for its unique terroir and expert craftsmanship.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Brewing Tab */}
                    {activeTab === 'brewing' && (
                        <div role="tabpanel" id="pdp-panel-brewing" aria-labelledby="pdp-tab-brewing" className="pdp-tabpanel">
                            {product.brewingInstructions ? (
                                <div>
                                    <div className="pdp-brew-grid">
                                        {[
                                            { icon: '🌡️', label: 'Temperature', val: product.brewingInstructions.temperature },
                                            { icon: '⏱️', label: 'Steep Time', val: product.brewingInstructions.steepTime },
                                            { icon: '🥄', label: 'Amount', val: product.brewingInstructions.amount },
                                        ].filter(x => x.val).map(x => (
                                            <div key={x.label} className="pdp-brew-card">
                                                <div className="pdp-brew-icon">{x.icon}</div>
                                                <div className="pdp-brew-label">{x.label}</div>
                                                <div className="pdp-brew-value">{x.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {product.brewingInstructions.steps?.length > 0 && (
                                        <div>
                                            <h3 className="mb-md">Step-by-Step Guide</h3>
                                            <ol className="pdp-steps">
                                                {product.brewingInstructions.steps.map((step, i) => (
                                                    <li key={i} className="pdp-step">{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="pdp-empty">
                                    <p>Brewing guide not available for this tea yet.</p>
                                    <p className="mt-md">General tip: Start with 85–95°C water and steep for 2–4 minutes depending on your taste preference.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div role="tabpanel" id="pdp-panel-reviews" aria-labelledby="pdp-tab-reviews" className="pdp-tabpanel">
                            {/* Rating Summary */}
                            {reviews.length > 0 && (
                                <div className="pdp-rating-summary">
                                    <div className="pdp-rating-summary__score">
                                        <div className="pdp-rating-summary__value">{avgRating?.toFixed(1)}</div>
                                        <div className="mt-xs">{renderStars(Math.round(avgRating || 0))}</div>
                                        <div className="pdp-rating-summary__count">{reviews.length} reviews</div>
                                    </div>
                                    <div className="pdp-rating-summary__bars">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = reviews.filter(r => r.rating === star).length;
                                            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                            return (
                                                <div key={star} className="pdp-rating-row">
                                                    <span className="min-w-20">{star}★</span>
                                                    <div className="pdp-rating-bar">
                                                        <progress value={pct} max={100} />
                                                    </div>
                                                    <span className="min-w-24 text-muted">{count}</span>
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

            {/* Lightbox / Image Zoom Modal */}
            {lightboxOpen && (
                <div
                    className="lightbox-overlay"
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.92)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: lightboxZoom ? 'zoom-out' : 'zoom-in',
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) { setLightboxOpen(false); setLightboxZoom(false); }
                    }}
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                    onTouchEnd={(e) => {
                        const diff = e.changedTouches[0].clientX - touchStartX.current;
                        if (Math.abs(diff) > 60) {
                            if (diff > 0) lightboxPrev();
                            else lightboxNext();
                        }
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={() => { setLightboxOpen(false); setLightboxZoom(false); }}
                        aria-label="Close lightbox"
                        style={{
                            position: 'absolute', top: 16, right: 16, zIndex: 10001,
                            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 22, cursor: 'pointer',
                        }}
                    >✕</button>

                    {/* Prev button */}
                    {imageCount > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                            aria-label="Previous image"
                            style={{
                                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10001,
                                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 22, cursor: 'pointer',
                            }}
                        >‹</button>
                    )}

                    {/* Next button */}
                    {imageCount > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                            aria-label="Next image"
                            style={{
                                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10001,
                                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 22, cursor: 'pointer',
                            }}
                        >›</button>
                    )}

                    {/* Image */}
                    <div
                        onClick={() => setLightboxZoom(z => !z)}
                        style={{
                            transition: 'transform 0.3s ease',
                            transform: lightboxZoom ? 'scale(1.8)' : 'scale(1)',
                            maxWidth: '90vw', maxHeight: '90vh',
                        }}
                    >
                        <Image
                            src={product.images?.[selectedImage] || product.images?.[0] || '/images/darjeeling-tea.png'}
                            alt={product.name}
                            width={800}
                            height={800}
                            style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: '85vh' }}
                            priority
                        />
                    </div>

                    {/* Image counter */}
                    {imageCount > 1 && (
                        <div style={{
                            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                            color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', zIndex: 10001,
                        }}>
                            {selectedImage + 1} / {imageCount}
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
}
