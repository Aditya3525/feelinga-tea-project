'use client';
import Layout from '../../components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast';
import { apiRequest } from '../../utils/api';

export default function Wishlist() {
    const { isAuthenticated, openAuthModal } = useAuth();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { setLoading(false); return; }
        loadWishlist();
    }, [isAuthenticated]);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            const data = await apiRequest('/auth/wishlist');
            setProducts(data.data || []);
        } catch (err: any) {
            console.error('Failed to load wishlist:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId: string) => {
        try {
            await apiRequest(`/auth/wishlist/${productId}`, { method: 'POST' });
            setProducts(prev => prev.filter(p => (p._id || p) !== productId));
            showToast('Removed from wishlist', 'success');
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    const handleAddToCart = (p: any) => {
        addToCart({
            id: p._id,
            slug: p.slug,
            name: p.name,
            price: p.prices?.['100g'] || 0,
            size: '100g',
            img: p.images?.[0] || '/images/darjeeling-tea.png',
        });
        showToast(`${p.name} added to cart!`, 'success');
    };

    if (!isAuthenticated) {
        return (
            <Layout>
                <div className="page-hero">
                    <div className="container">
                        <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Wishlist</span></nav>
                        <h1>My Wishlist</h1>
                    </div>
                </div>
                <div className="container section" style={{ textAlign: 'center', padding: 'var(--space-4xl) 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>❤️</div>
                    <h2>Please sign in to view your wishlist</h2>
                    <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Save your favourite teas and find them here anytime.</p>
                    <button className="btn btn--primary" style={{ marginTop: 'var(--space-xl)' }} onClick={openAuthModal}>Sign In</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Wishlist</span></nav>
                    <p className="overline">Saved Favourites</p>
                    <h1>My Wishlist</h1>
                    <p>Your hand-picked selection of teas you love.</p>
                </div>
            </div>
            <div className="container section">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
                        <div style={{ fontSize: '2rem' }}>🍵</div>
                        <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Loading your wishlist...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-4xl) 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🤍</div>
                        <h2>Your wishlist is empty</h2>
                        <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Browse our collection and save the teas you love.</p>
                        <Link href="/shop" className="btn btn--primary" style={{ marginTop: 'var(--space-xl)', display: 'inline-block' }}>Shop Teas</Link>
                    </div>
                ) : (
                    <>
                        <p style={{ marginBottom: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>{products.length} {products.length === 1 ? 'item' : 'items'} saved</p>
                        <div className="plp-products">
                            {products.map((p) => {
                                const price = p.prices?.['100g'] || 0;
                                const img = p.images?.[0] || '/images/darjeeling-tea.png';
                                return (
                                    <div className="product-card" key={p._id}>
                                        {!p.inStock && <span className="product-card__badge" style={{ background: '#e74c3c' }}>Sold Out</span>}
                                        <Link href={`/product/${p.slug}`}>
                                            <div className="product-card__img">
                                                <Image src={img} alt={p.name} width={300} height={300} style={{ objectFit: 'contain', width: '100%', height: 'auto' }} />
                                            </div>
                                        </Link>
                                        <div className="product-card__body">
                                            <div className="product-card__type">{p.type}</div>
                                            <Link href={`/product/${p.slug}`} className="product-card__name">{p.name}</Link>
                                            <div className="product-card__note">{p.shortDescription || ''}</div>
                                            <div className="product-card__bottom">
                                                <div className="product-card__price">₹{price.toLocaleString()}</div>
                                                <div className="product-card__rating">{'★'.repeat(Math.round(p.rating || 5))} <span>({p.reviewCount || 0})</span></div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 12 }}>
                                                <button
                                                    className="btn btn--primary btn--sm"
                                                    style={{ flex: 1 }}
                                                    onClick={() => handleAddToCart(p)}
                                                    disabled={!p.inStock}
                                                >
                                                    {p.inStock ? 'Add to Cart' : 'Sold Out'}
                                                </button>
                                                <button
                                                    className="btn btn--ghost btn--sm"
                                                    style={{ color: 'var(--color-error)' }}
                                                    onClick={() => removeFromWishlist(p._id)}
                                                    title="Remove from wishlist"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
