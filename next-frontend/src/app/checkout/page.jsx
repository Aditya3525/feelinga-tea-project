'use client';
import Layout from '../../components/Layout';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { apiRequest } from '../../utils/api';

export default function Checkout() {
    const { cart, subtotal, shipping, clearCart } = useCart();
    const { isAuthenticated, openAuthModal } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [address, setAddress] = useState({ firstName: '', lastName: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax;

    const handlePlaceOrder = async () => {
        if (!isAuthenticated) { openAuthModal(); return; }
        setLoading(true);
        try {
            const items = cart.map(item => ({
                productId: item.id,
                size: item.size || '100g',
                qty: item.qty,
            }));
            const result = await apiRequest('/orders', {
                method: 'POST',
                body: JSON.stringify({ items, shippingAddress: address, paymentMethod, notes }),
            });
            clearCart();
            showToast('Order placed! 🎉', 'success');
            const orderId = result.data?._id ? `#${result.data._id.slice(-6).toUpperCase()}` : '';
            const uniqueItems = cart.reduce((n, i) => n + i.qty, 0);
            router.push(`/order-confirm?order=${orderId}&items=${uniqueItems}&total=${total}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0 && step < 4) {
        return (
            <Layout>
                <div className="container section" style={{ textAlign: 'center', padding: 'var(--space-4xl) 0' }}>
                    <h2>Your cart is empty</h2>
                    <p style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>Add some teas to get started!</p>
                    <Link href="/shop" className="btn btn--primary">Shop Teas</Link>
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
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)', marginBottom: 'var(--space-3xl)' }}>
                    {['Shipping', 'Payment', 'Review', 'Confirm'].map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', opacity: step >= i + 1 ? 1 : 0.4 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: step >= i + 1 ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{i + 1}</div>
                            <span style={{ fontWeight: step === i + 1 ? 700 : 400 }}>{s}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-3xl)', alignItems: 'start' }}>
                    <div>
                        {/* Step 1: Shipping */}
                        {step === 1 && (
                            <div>
                                <h2 style={{ marginBottom: 'var(--space-lg)' }}>Shipping Address</h2>
                                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}><span>Tax (5% GST)</span><span>₹{tax}</span></div>
                            <hr style={{ marginBottom: 'var(--space-md)', border: 'none', borderTop: '1px solid var(--color-border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem' }}><span>Total</span><span>₹{total}</span></div>
                            {subtotal < 999 && <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-sm)', color: 'var(--color-text-muted)' }}>Add ₹{999 - subtotal} more for free shipping!</p>}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
