'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../context/AuthContext';
import { apiRequest } from '../../../../utils/api';
import { useToast } from '../../../../components/Toast';
import type { OrderDetail, OrderItem } from '../../../../types/app';

function getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback;
}

export default function OrderDetail() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { showToast } = useToast();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    useEffect(() => {
        if (!id) {
            setError('Invalid order id');
            setLoading(false);
            return;
        }

        if (!isAuthenticated) {
            router.push('/');
            return;
        }

        async function fetchOrder() {
            try {
                const data = await apiRequest(`/orders/${id}`);
                setOrder(data.data as OrderDetail);
            } catch (err) {
                setError(getErrorMessage(err, 'Failed to load order'));
            } finally {
                setLoading(false);
            }
        }
        fetchOrder();
    }, [id, isAuthenticated, router]);

    const statusColor = (status: string) => {
        const map: Record<string, string> = {
            pending:    'var(--color-warning)',
            confirmed:  'var(--color-info)',
            processing: '#8b5cf6',
            shipped:    'var(--color-success)',
            delivered:  'var(--color-success)',
            cancelled:  'var(--color-error)',
        };
        return map[status] || '#999';
    };

    const canCancel = Boolean(order && ['pending', 'confirmed'].includes(order.status));

    const handleCancel = async () => {
        if (!id) return;
        if (!cancelConfirm) { setCancelConfirm(true); return; }
        setCancelConfirm(false);
        setCancelLoading(true);
        try {
            await apiRequest(`/orders/${id}/cancel`, {
                method: 'PATCH',
                body: JSON.stringify({ reason: 'Customer requested cancellation' }),
            });
            const data = await apiRequest(`/orders/${id}`);
            setOrder(data.data as OrderDetail);
        } catch (err) {
            showToast(getErrorMessage(err, 'Failed to cancel order'), 'error');
        } finally {
            setCancelLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p>Loading order...</p>
                </div>
            </Layout>
        );
    }

    if (error || !order) {
        return (
            <Layout>
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>{error || 'Order not found'}</p>
                    <Link href="/profile" className="btn btn--ghost">Back to Profile</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-hero" style={{ paddingBottom: 'var(--space-md)' }}>
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link href="/">Home</Link> <span>/</span>
                        <Link href="/profile">My Account</Link> <span>/</span>
                        <span>Order {order.orderNumber}</span>
                    </nav>
                </div>
            </div>

            <div className="container">
                <div className="section" style={{ maxWidth: 800, margin: '0 auto' }}>
                    {/* Order Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Order {order.orderNumber}</h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <span style={{
                            background: statusColor(order.status),
                            color: '#fff',
                            padding: '6px 16px',
                            borderRadius: 20,
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                        }}>
                            {order.status}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
                        {canCancel && (
                            cancelConfirm ? (
                                <>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Cancel this order?</span>
                                    <button className="btn btn--sm" style={{ background: 'var(--color-error)', color: '#fff', borderColor: 'var(--color-error)' }} onClick={handleCancel} disabled={cancelLoading}>
                                        {cancelLoading ? 'Cancelling…' : 'Yes, cancel'}
                                    </button>
                                    <button className="btn btn--ghost btn--sm" onClick={() => setCancelConfirm(false)}>Keep order</button>
                                </>
                            ) : (
                                <button
                                    className="btn btn--ghost btn--sm"
                                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                    onClick={handleCancel}
                                >
                                    ✕ Cancel Order
                                </button>
                            )
                        )}
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={async () => {
                                try {
                                    const token = localStorage.getItem('feelinga_token');
                                    const res = await fetch(`/api/v1/orders/${id}/invoice`, {
                                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                                    });
                                    if (!res.ok) throw new Error('Failed to download invoice');
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `invoice-${order.orderNumber}.pdf`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                } catch {
                                    showToast('Failed to download invoice', 'error');
                                }
                            }}
                        >
                            📄 Download Invoice
                        </button>
                    </div>

                    {/* Tracking Info */}
                    {order.trackingNumber && (
                        <div style={{ background: 'rgba(46,204,113,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)', border: '1px solid rgba(46,204,113,0.2)' }}>
                            <h3 style={{ marginBottom: 'var(--space-sm)' }}>📦 Tracking Information</h3>
                            <p style={{ fontSize: '0.9rem' }}>
                                <strong>Tracking Number:</strong> {order.trackingNumber}
                            </p>
                            {order.trackingUrl && (
                                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--sm" style={{ marginTop: 'var(--space-sm)', display: 'inline-block' }}>
                                    Track Shipment →
                                </a>
                            )}
                        </div>
                    )}

                    {/* Items */}
                    <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--space-md)' }}>Items</h3>
                        {order.items?.map((item: OrderItem, i: number) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                                padding: 'var(--space-md) 0',
                                borderBottom: i < ((order.items?.length || 0) - 1) ? '1px solid var(--color-border)' : 'none',
                            }}>
                                {item.image && (
                                    <Image src={item.image} alt={item.name} width={60} height={60} style={{ objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        Size: {item.size} &middot; Qty: {item.qty}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 600 }}>₹{(item.price * item.qty).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                        {/* Shipping Address */}
                        <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
                            <h3 style={{ marginBottom: 'var(--space-md)' }}>Shipping Address</h3>
                            {order.shippingAddress && (
                                <div style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
                                    <div style={{ fontWeight: 600 }}>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                                    <div>{order.shippingAddress.line1}</div>
                                    {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</div>
                                    <div>📞 {order.shippingAddress.phone}</div>
                                </div>
                            )}
                        </div>

                        {/* Payment Summary */}
                        <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
                            <h3 style={{ marginBottom: 'var(--space-md)' }}>Payment Summary</h3>
                            <div style={{ fontSize: '0.9rem', lineHeight: 2 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Subtotal</span><span>₹{order.subtotal?.toLocaleString()}</span>
                                </div>
                                {(order.discount || 0) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                                        <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><span>−₹{order.discount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Shipping</span><span>{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Tax (GST 5%)</span><span>₹{order.tax?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--color-border)', paddingTop: 8, marginTop: 8, fontSize: '1.1rem' }}>
                                    <span>Total</span><span>₹{order.total?.toLocaleString()}</span>
                                </div>
                                <div style={{ marginTop: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    Payment: {order.paymentMethod?.toUpperCase()} • {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ ' + (order.paymentStatus || 'Pending')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {order.notes && (
                        <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                            <h3 style={{ marginBottom: 'var(--space-sm)' }}>Order Notes</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{order.notes}</p>
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <Link href="/profile" className="btn btn--ghost">← Back to My Account</Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
