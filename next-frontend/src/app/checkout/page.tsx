'use client';
import Layout from '../../components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { apiRequest } from '../../utils/api';
export default function Checkout() {
    const { cart, subtotal, shipping, clearCart } = useCart();
    const { isAuthenticated, openAuthModal, user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [address, setAddress] = useState({ firstName: '', lastName: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState<any>(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    // Pre-fill shipping address from user's default saved address
    useEffect(() => {
        if (!isAuthenticated || !user?.addresses?.length) return;
        const defaultAddr = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
        if (defaultAddr && !address.firstName && !address.line1) {
            const nameParts = (defaultAddr.fullName || '').split(' ');
            setAddress({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                line1: defaultAddr.addressLine1 || '',
                line2: defaultAddr.addressLine2 || '',
                city: defaultAddr.city || '',
                state: defaultAddr.state || '',
                pincode: defaultAddr.pincode || '',
                phone: defaultAddr.phone || '',
            });
        }
    }, [isAuthenticated, user]);

    const discount = couponApplied?.discount || 0;
    const tax = Math.round((subtotal - discount) * 0.05);
    const total = subtotal + shipping + tax - discount;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponError('');
        setCouponLoading(true);
        try {
            const data = await apiRequest('/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({ code: couponCode.trim(), subtotal }),
            });
            setCouponApplied(data.data);
        } catch (err: any) {
            setCouponError(err.message || 'Invalid coupon');
            setCouponApplied(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setCouponApplied(null);
        setCouponCode('');
        setCouponError('');
    };

    const handlePlaceOrder = async () => {
        if (!isAuthenticated) { openAuthModal(); return; }
        // Filter out non-orderable items (e.g. gift sets with placeholder IDs)
        const orderableItems = cart.filter(item => item.id && /^[a-f0-9]{24}$/i.test(item.id));
        if (orderableItems.length === 0) {
            showToast('Your cart has no orderable products. Gift sets require a custom enquiry — please contact us.', 'error');
            return;
        }
        if (orderableItems.length < cart.length) {
            showToast(`${cart.length - orderableItems.length} gift set(s) removed — contact us to order those separately.`, 'info');
        }
        setLoading(true);
        try {
            const items = orderableItems.map(item => ({
                productId: item.id,
                size: item.size || '100g',
                qty: item.qty,
            }));
            const result = await apiRequest('/orders', {
                method: 'POST',
                body: JSON.stringify({ items, shippingAddress: address, paymentMethod, notes, couponCode: couponApplied?.code || undefined }),
            });
            const orderNumber = result.data?.orderNumber || '';
            const uniqueItems = cart.reduce((n, i) => n + i.qty, 0);
            clearCart();
            showToast('Order placed! 🎉', 'success');
            router.push(`/order-confirm?order=${encodeURIComponent(orderNumber)}&items=${uniqueItems}&total=${total}`);
        } catch (err: any) {
            showToast(err?.message || 'Failed to place order', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0 && step < 4) {
        return (
            <Layout>
                <div className="container section">
                    <EmptyState icon="🛒" iconSize="lg" title="Your cart is empty" message="Add some teas to get started!" actionLabel="Shop Teas" actionHref="/shop" />
                </div>
            </Layout>
        );
    }

    if (!isAuthenticated) {
        return (
            <Layout>
                <div className="page-hero">
                    <div className="container">
                        <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Checkout</span></nav>
                        <h1>Checkout</h1>
                    </div>
                </div>
                <div className="container section" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 'var(--space-4xl) var(--space-lg)' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-lg)' }}>🔒</div>
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>Sign in to continue</h2>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 'var(--space-xl)' }}>
                        Please log in or create an account to complete your purchase. This helps us track your order and send you updates.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn--primary" onClick={openAuthModal} style={{ minWidth: 180 }}>
                            Log In / Sign Up
                        </button>
                        <Link href="/shop" className="btn btn--ghost" style={{ minWidth: 180 }}>
                            Continue Shopping
                        </Link>
                    </div>
                    <div style={{ marginTop: 'var(--space-2xl)', padding: 'var(--space-lg)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
                        <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Your cart is safe 🛒</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            You have {cart.reduce((sum, i) => sum + i.qty, 0)} item{cart.reduce((sum, i) => sum + i.qty, 0) !== 1 ? 's' : ''} worth ₹{subtotal.toLocaleString()} in your cart. They&apos;ll be waiting for you after you sign in.
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-hero">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>Checkout</span></nav>
                    <h1>Checkout</h1>
                </div>
            </div>

            <div className="container section">
                {/* Progress */}
                <div className="checkout-stepper">
                    {['Shipping', 'Payment', 'Review', 'Confirm'].map((s, i) => (
                        <div key={i} className={`checkout-stepper__step ${step >= i + 1 ? 'checkout-stepper__step--active' : ''}`}>
                            <div className={`checkout-stepper__circle ${step >= i + 1 ? 'checkout-stepper__circle--active' : ''}`}>{i + 1}</div>
                            <span className={`checkout-stepper__label ${step === i + 1 ? 'checkout-stepper__label--current' : ''}`}>{s}</span>
                        </div>
                    ))}
                </div>

                <div className="checkout-layout">
                    <div>
                        {/* Step 1: Shipping */}
                        {step === 1 && (
                            <div>
                                <h2 style={{ marginBottom: 'var(--space-lg)' }}>Shipping Address</h2>
                                {isAuthenticated && user?.addresses?.length > 0 && (
                                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                                        <label style={{ fontWeight: 600, marginBottom: 'var(--space-xs)', display: 'block' }}>Use a saved address</label>
                                        <select
                                            style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                                            onChange={(e) => {
                                                const addr = user.addresses[parseInt(e.target.value)];
                                                if (!addr) return;
                                                const nameParts = (addr.fullName || '').split(' ');
                                                setAddress({
                                                    firstName: nameParts[0] || '',
                                                    lastName: nameParts.slice(1).join(' ') || '',
                                                    line1: addr.addressLine1 || '',
                                                    line2: addr.addressLine2 || '',
                                                    city: addr.city || '',
                                                    state: addr.state || '',
                                                    pincode: addr.pincode || '',
                                                    phone: addr.phone || '',
                                                });
                                            }}
                                            defaultValue={user.addresses.findIndex((a: any) => a.isDefault) >= 0 ? user.addresses.findIndex((a: any) => a.isDefault) : 0}
                                        >
                                            {user.addresses.map((a: any, i: number) => (
                                                <option key={a._id || i} value={i}>{a.label} — {a.fullName}, {a.city}{a.isDefault ? ' (Default)' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="checkout-shipping-form">
                                    <div><label>First Name *</label><input type="text" required value={address.firstName} onChange={e => setAddress({ ...address, firstName: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>Last Name *</label><input type="text" required value={address.lastName} onChange={e => setAddress({ ...address, lastName: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label>Address Line 1 *</label><input type="text" required value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label>Address Line 2</label><input type="text" value={address.line2} onChange={e => setAddress({ ...address, line2: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>City *</label><input type="text" required value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>State *</label><input type="text" required value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>Pincode *</label><input type="text" required minLength={5} maxLength={6} value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>Phone *</label><input type="tel" required minLength={10} value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div style={{ gridColumn: '1 / -1', marginTop: 'var(--space-md)' }}><button type="submit" className="btn btn--primary">Continue to Payment</button></div>
                                </form>
                            </div>
                        )}

                        {/* Step 2: Payment */}
                        {step === 2 && (
                            <div>
                                <h2 style={{ marginBottom: 'var(--space-lg)' }}>Payment Method</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {[{ value: 'cod', label: '💰 Cash on Delivery' }, { value: 'upi', label: '📱 UPI' }, { value: 'card', label: '💳 Credit/Debit Card' }].map(pm => (
                                        <label key={pm.value} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', border: `2px solid ${paymentMethod === pm.value ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                                            <input type="radio" name="payment" value={pm.value} checked={paymentMethod === pm.value} onChange={() => setPaymentMethod(pm.value)} />
                                            {pm.label}
                                        </label>
                                    ))}
                                </div>
                                <div style={{ marginTop: 'var(--space-lg)' }}><label>Order Notes (optional)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', minHeight: 80, marginTop: 'var(--space-xs)' }} /></div>
                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                                    <button className="btn btn--ghost" onClick={() => setStep(1)}>← Back</button>
                                    <button className="btn btn--primary" onClick={() => setStep(3)}>Review Order</button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div>
                                <h2 style={{ marginBottom: 'var(--space-lg)' }}>Review Your Order</h2>
                                <div style={{ marginBottom: 'var(--space-lg)' }}>
                                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>Shipping To</h3>
                                    <p>{address.firstName} {address.lastName}<br />{address.line1}{address.line2 && `, ${address.line2}`}<br />{address.city}, {address.state} - {address.pincode}<br />📞 {address.phone}</p>
                                </div>
                                <div style={{ marginBottom: 'var(--space-lg)' }}>
                                    <h3>Payment: {paymentMethod.toUpperCase()}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                                    <button className="btn btn--ghost" onClick={() => setStep(2)}>← Back</button>
                                    <button className="btn btn--primary" onClick={handlePlaceOrder} disabled={loading}>{loading ? '⏳ Placing...' : 'Place Order'}</button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Confirmation */}
                        {step === 4 && (
                            <div style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
                                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>🎉</div>
                                <h2>Order Placed!</h2>
                                <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Thank you for your order. We&apos;ll send you a confirmation email shortly.</p>
                                <Link href="/shop" className="btn btn--primary" style={{ marginTop: 'var(--space-xl)', display: 'inline-block' }}>Continue Shopping</Link>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    {step < 4 && (
                        <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', position: 'sticky', top: 100 }}>
                            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Order Summary</h3>
                            {cart.map((item) => (
                                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                    <span>{item.name} · {item.size} × {item.qty}</span>
                                    <span>₹{item.price * item.qty}</span>
                                </div>
                            ))}
                            <hr style={{ margin: 'var(--space-md) 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}><span>Subtotal</span><span>₹{subtotal}</span></div>
                            {couponApplied && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)', color: 'var(--color-success)' }}>
                                    <span>Discount ({couponApplied.code})</span>
                                    <span>−₹{discount}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}><span>Tax (5% GST)</span><span>₹{tax}</span></div>
                            <hr style={{ marginBottom: 'var(--space-md)', border: 'none', borderTop: '1px solid var(--color-border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem' }}><span>Total</span><span>₹{total}</span></div>
                            {subtotal < 999 && <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-sm)', color: 'var(--color-text-muted)' }}>Add ₹{999 - subtotal} more for free shipping!</p>}

                            {/* Coupon Code */}
                            <div style={{ marginTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 'var(--space-xs)', display: 'block' }}>Have a coupon?</label>
                                {couponApplied ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '8px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-success)' }}>
                                        <span style={{ flex: 1, fontWeight: 600, color: 'var(--color-success)' }}>✓ {couponApplied.code} applied (−₹{discount})</span>
                                        <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontWeight: 600 }}>✕</button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                            <input
                                                type="text"
                                                placeholder="Enter code"
                                                value={couponCode}
                                                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                                                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase' }}
                                            />
                                            <button className="btn btn--primary btn--sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                                                {couponLoading ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: 4 }}>{couponError}</p>}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
