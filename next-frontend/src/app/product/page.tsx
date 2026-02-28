'use client';
import Layout from '../../components/Layout';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast';

const product = {
    name: 'Classic Assam Breakfast',
    type: 'Black Tea',
    price: 499,
    prices: { '50g': 299, '100g': 499, '200g': 898 },
    rating: 4.8,
    reviewCount: 156,
    description: 'A bold, full-bodied black tea from the finest Assam estates. Rich malty character with a brisk, coppery liquor that pairs perfectly with milk. Our Classic Assam Breakfast is sourced from the second flush harvest, known for producing the most flavorful leaves.',
    origin: 'Assam, India',
    caffeine: 'High',
    tastingNotes: ['Malt', 'Honey', 'Caramel'],
    brewing: { temperature: '95°C', steepTime: '3-5 min', amount: '2g per cup' },
    images: ['/images/darjeeling-tea.png'],
};

export default function Product() {
    const [selectedSize, setSelectedSize] = useState('100g');
    const [qty, setQty] = useState(1);
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const currentPrice = product.prices[selectedSize] || product.prices['100g'];

    const handleAddToCart = () => {
        for (let i = 0; i < qty; i++) {
            addToCart(product.name, currentPrice, product.images[0]);
        }
        showToast(`${product.name} added to cart!`, 'success', product.images[0]);
    };

    return (
        <Layout>
            <div className="page-hero" style={{ paddingBottom: 'var(--space-md)' }}>
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link href="/">Home</Link> <span>/</span> <Link href="/shop">Shop</Link> <span>/</span> <span>{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="container">
                <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3xl)', alignItems: 'start' }}>
                    {/* Product Image */}
                    <div className="pdp-gallery">
                        <div className="pdp-gallery__main" style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)', textAlign: 'center' }}>
                            <img src={product.images[0]} alt={product.name} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="pdp-info">
                        <div className="product-card__type" style={{ fontSize: '0.85rem', marginBottom: 'var(--space-xs)' }}>{product.type}</div>
                        <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>{product.name}</h1>
                        <div className="product-card__rating" style={{ marginBottom: 'var(--space-md)' }}>
                            {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))} <span>({product.reviewCount} reviews)</span>
                        </div>
                        <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{product.description}</p>

                        {/* Size Selector */}
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Select Size</label>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                {Object.entries(product.prices).map(([size, price]) => (
                                    <button key={size} className={`btn ${selectedSize === size ? 'btn--primary' : 'btn--ghost'} btn--sm`} onClick={() => setSelectedSize(size)}>
                                        {size} — ₹{price}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                            <label style={{ fontWeight: 600 }}>Quantity</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px' }}>
                                <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                                <span style={{ minWidth: 30, textAlign: 'center' }}>{qty}</span>
                                <button onClick={() => setQty(qty + 1)}>+</button>
                            </div>
                        </div>

                        {/* Price & Add to Cart */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>₹{currentPrice * qty}</div>
                            <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleAddToCart}>Add to Cart</button>
                        </div>

                        {/* Details */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                <div><strong>Origin:</strong> {product.origin}</div>
                                <div><strong>Caffeine:</strong> {product.caffeine}</div>
                                <div><strong>Tasting Notes:</strong> {product.tastingNotes.join(' · ')}</div>
                            </div>
                        </div>

                        {/* Brewing Instructions */}
                        <div style={{ marginTop: 'var(--space-xl)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
                            <h3 style={{ marginBottom: 'var(--space-md)' }}>🍵 Brewing Guide</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                                <div><strong>Temperature</strong><br />{product.brewing.temperature}</div>
                                <div><strong>Steep Time</strong><br />{product.brewing.steepTime}</div>
                                <div><strong>Amount</strong><br />{product.brewing.amount}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}



