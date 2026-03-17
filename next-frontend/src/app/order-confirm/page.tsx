'use client';
import { Suspense } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function OrderConfirmInner() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('order') || null;
    const itemsParam = searchParams.get('items');
    const totalParam = searchParams.get('total');
    const items = itemsParam ? parseInt(itemsParam, 10) : null;
    const total = totalParam ? parseInt(totalParam, 10) : null;

    return (
        <Layout>
            <div className="container section" style={{ textAlign: 'center', padding: 'var(--space-4xl) 0', maxWidth: 600, margin: '0 auto' }}>
                {/* Success animation */}
                <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-gold, #c9a84c))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--space-xl)',
                    fontSize: '2.5rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                    🎉
                </div>

                <h1 style={{ fontSize: '2.2rem', marginBottom: 'var(--space-md)' }}>Order Placed!</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 'var(--space-xl)' }}>
                    Thank you for choosing Feelinga. Your teas are on their way!
                </p>

                {/* Order details card */}
                <div style={{
                    background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'left',
                }}>
                    {orderNumber && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Order Number</span>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>{orderNumber}</strong>
                        </div>
                    )}
                    {items && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Items</span>
                            <span>{items} {items === 1 ? 'item' : 'items'}</span>
                        </div>
                    )}
                    {total && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Total Paid</span>
                            <strong>₹{total.toLocaleString()}</strong>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Estimated Delivery</span>
                        <span>3–5 business days</span>
                    </div>
                </div>

                {/* What happens next */}
                <div style={{ textAlign: 'left', marginBottom: 'var(--space-2xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>What happens next?</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {[
                            { icon: '📧', step: 'Confirmation email', desc: 'You\'ll receive an email with your order details shortly.' },
                            { icon: '📦', step: 'Order processing', desc: 'We\'ll carefully pack your teas within 1 business day.' },
                            { icon: '🚚', step: 'Dispatch & tracking', desc: 'You\'ll get a tracking link once your order ships.' },
                            { icon: '🍵', step: 'Enjoy your teas', desc: 'Fresh, garden-to-cup goodness arrives at your door!' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 40, height: 40, minWidth: 40, borderRadius: '50%',
                                    background: 'var(--color-accent)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.1rem',
                                }}>{item.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.step}</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/profile?tab=orders" className="btn btn--ghost">View My Orders</Link>
                    <Link href="/shop" className="btn btn--primary">Continue Shopping</Link>
                </div>
            </div>
        </Layout>
    );
}

export default function OrderConfirmPage() {
    return (
        <Suspense fallback={<Layout><div className="container section" style={{ textAlign: 'center' }}>Loading...</div></Layout>}>
            <OrderConfirmInner />
        </Suspense>
    );
}
