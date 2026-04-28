'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../context/AuthContext';
import { apiRequest } from '../../../../utils/api';
import { useToast } from '../../../../components/Toast';
import AppIcon from '../../../../components/AppIcon';
import type { OrderDetail, OrderItem } from '../../../../types/app';

function getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback;
}

function getOrderItemHref(item: OrderItem): string | null {
    if (item.product && typeof item.product === 'object' && item.product.slug) {
        return `/product/${item.product.slug}`;
    }

    return null;
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
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    const fetchOrderData = async (orderId: string) => {
        const data = await apiRequest(`/orders/${orderId}`);
        setOrder(data.data as OrderDetail);
    };

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
                await fetchOrderData(id);
            } catch (err) {
                setError(getErrorMessage(err, 'Failed to load order'));
            } finally {
                setLoading(false);
            }
        }
        fetchOrder();
    }, [id, isAuthenticated, router]);

    const statusClass = (status: string) => {
        const map: Record<string, string> = {
            pending: 'order-detail__status--pending',
            confirmed: 'order-detail__status--confirmed',
            processing: 'order-detail__status--processing',
            shipped: 'order-detail__status--shipped',
            delivered: 'order-detail__status--delivered',
            cancelled: 'order-detail__status--cancelled',
        };
        return map[status] || 'order-detail__status--default';
    };

    const canCancel = Boolean(order && ['pending', 'confirmed'].includes(order.status));

    const handleCancel = async () => {
        if (!id) return;
        if (cancelLoading) return;
        if (!cancelConfirm) { setCancelConfirm(true); return; }
        setCancelConfirm(false);
        setCancelLoading(true);
        try {
            await apiRequest(`/orders/${id}/cancel`, {
                method: 'PATCH',
                body: JSON.stringify({ reason: 'Customer requested cancellation' }),
            });
            await fetchOrderData(id);
            showToast('Order cancelled successfully', 'success');
        } catch (err) {
            showToast(getErrorMessage(err, 'Failed to cancel order'), 'error');
        } finally {
            setCancelLoading(false);
        }
    };

    const handleInvoiceDownload = async () => {
        if (!id || invoiceLoading) return;
        setInvoiceLoading(true);
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
            a.download = `invoice-${order?.orderNumber || id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            showToast(getErrorMessage(err, 'Failed to download invoice'), 'error');
        } finally {
            setInvoiceLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="order-detail__state order-detail__state--loading">
                    <p>Loading order...</p>
                </div>
            </Layout>
        );
    }

    if (error || !order) {
        return (
            <Layout>
                <div className="order-detail__state order-detail__state--error">
                    <p className="order-detail__state-message">{error || 'Order not found'}</p>
                    <button type="button" className="btn btn--primary" onClick={() => { if (id) { setLoading(true); setError(null); fetchOrderData(id).catch((err) => setError(getErrorMessage(err, 'Failed to load order'))).finally(() => setLoading(false)); } }}>Retry</button>
                    <Link href="/profile" className="btn btn--ghost">Back to Profile</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-hero order-detail__hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link href="/">Home</Link> <span>/</span>
                        <Link href="/profile">My Account</Link> <span>/</span>
                        <span>Order {order.orderNumber}</span>
                    </nav>
                </div>
            </div>

            <div className="container">
                <div className="section order-detail">
                    {/* Order Header */}
                    <div className="order-detail__header">
                        <div>
                            <h1 className="order-detail__title">Order {order.orderNumber}</h1>
                            <p className="order-detail__placed-at">
                                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <span className={`order-detail__status ${statusClass(order.status)}`}>
                            {order.status}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="order-detail__actions">
                        {canCancel && (
                            cancelConfirm ? (
                                <>
                                    <span className="order-detail__cancel-prompt">Cancel this order?</span>
                                    <button type="button" className="btn btn--sm order-detail__cancel-confirm" onClick={handleCancel} disabled={cancelLoading} aria-busy={cancelLoading}>
                                        {cancelLoading ? 'Cancelling…' : 'Yes, cancel'}
                                    </button>
                                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCancelConfirm(false)} disabled={cancelLoading}>Keep order</button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn--ghost btn--sm order-detail__cancel-trigger"
                                    onClick={handleCancel}
                                    disabled={cancelLoading}
                                >
                                    <AppIcon name="xCircle" size={14} aria-hidden /> Cancel Order
                                </button>
                            )
                        )}
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={handleInvoiceDownload}
                            disabled={invoiceLoading}
                            aria-busy={invoiceLoading}
                        >
                            <AppIcon name="receipt" size={14} aria-hidden /> {invoiceLoading ? 'Downloading…' : 'Download Invoice'}
                        </button>
                    </div>

                    {/* Tracking Info */}
                    {order.trackingNumber && (
                        <div className="order-detail__tracking">
                            <h3 className="order-detail__tracking-title"><AppIcon name="package" size={16} aria-hidden /> Tracking Information</h3>
                            <p className="order-detail__tracking-copy">
                                <strong>Tracking Number:</strong> {order.trackingNumber}
                            </p>
                            {order.trackingUrl && (
                                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--sm order-detail__tracking-link">
                                    Track Shipment →
                                </a>
                            )}
                        </div>
                    )}

                    {/* Items */}
                    <div className="order-detail__card">
                        <h3 className="order-detail__card-title">Items</h3>
                        {order.items?.map((item: OrderItem, i: number) => {
                            const itemHref = getOrderItemHref(item);
                            const itemRow = (
                                <div className={`order-detail__item-row ${i < ((order.items?.length || 0) - 1) ? 'order-detail__item-row--divider' : ''}`}>
                                    {item.image && (
                                        <Image src={item.image} alt={item.name} width={60} height={60} className="order-detail__item-image" />
                                    )}
                                    <div className="order-detail__item-main">
                                        <div className="order-detail__item-name">{item.name}</div>
                                        <div className="order-detail__item-meta">
                                            Size: {item.size} &middot; Qty: {item.qty}
                                        </div>
                                    </div>
                                    <div className="order-detail__item-price">₹{(item.price * item.qty).toLocaleString()}</div>
                                </div>
                            );

                            return itemHref ? (
                                <Link key={i} href={itemHref} className="order-detail__item-link">
                                    {itemRow}
                                </Link>
                            ) : (
                                <div key={i}>{itemRow}</div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="order-detail__summary-grid">
                        {/* Shipping Address */}
                        <div className="order-detail__card">
                            <h3 className="order-detail__card-title">Shipping Address</h3>
                            {order.shippingAddress && (
                                <div className="order-detail__address">
                                    <div className="order-detail__address-name">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                                    <div>{order.shippingAddress.line1}</div>
                                    {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</div>
                                    <div><AppIcon name="phone" size={14} aria-hidden /> {order.shippingAddress.phone}</div>
                                </div>
                            )}
                        </div>

                        {/* Payment Summary */}
                        <div className="order-detail__card">
                            <h3 className="order-detail__card-title">Payment Summary</h3>
                            <div className="order-detail__payment">
                                <div className="order-detail__payment-row">
                                    <span>Subtotal</span><span>₹{order.subtotal?.toLocaleString()}</span>
                                </div>
                                {(order.discount || 0) > 0 && (
                                    <div className="order-detail__payment-row order-detail__payment-row--discount">
                                        <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><span>−₹{order.discount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="order-detail__payment-row">
                                    <span>Shipping</span><span>{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
                                </div>
                                <div className="order-detail__payment-row">
                                    <span>Tax (GST 5%)</span><span>₹{order.tax?.toLocaleString()}</span>
                                </div>
                                <div className="order-detail__payment-total">
                                    <span>Total</span><span>₹{order.total?.toLocaleString()}</span>
                                </div>
                                <div className="order-detail__payment-meta">
                                    Payment: {order.paymentMethod?.toUpperCase()} • {order.paymentStatus === 'paid' ? 'Paid' : (order.paymentStatus || 'Pending')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {order.notes && (
                        <div className="order-detail__card order-detail__notes">
                            <h3 className="order-detail__notes-title">Order Notes</h3>
                            <p className="order-detail__notes-copy">{order.notes}</p>
                        </div>
                    )}

                    <div className="order-detail__footer">
                        <Link href="/profile" className="btn btn--ghost">← Back to My Account</Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
