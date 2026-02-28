'use client';
import Layout from '../../components/Layout';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import '../../styles/profile.css';

export default function Profile() {
    const { user, isAuthenticated, isAdmin, openAuthModal, logout, updateProfile, setUser } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('info');
    const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
    const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) return;
        loadOrders();
    }, [isAuthenticated]);

    const loadOrders = async () => {
        try {
            const data = await apiRequest('/orders');
            setOrders(data.data || []);
        } catch (err) {
            console.error('Failed to load orders:', err);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileMsg({ text: '', type: '' });
        try {
            const name = e.target.profileName.value.trim();
            const email = e.target.profileEmail.value.trim();
            const phone = e.target.profilePhone.value.trim();
            await updateProfile({ name, email, phone });
            setProfileMsg({ text: 'Profile updated!', type: 'success' });
        } catch (err) {
            setProfileMsg({ text: err.message, type: 'error' });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMsg({ text: '', type: '' });
        const currentPassword = e.target.currentPassword.value;
        const newPassword = e.target.newPassword.value;
        const confirmPassword = e.target.confirmPassword.value;
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ text: 'Passwords do not match', type: 'error' });
            return;
        }
        try {
            await apiRequest('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
            e.target.reset();
        } catch (err) {
            setPasswordMsg({ text: err.message, type: 'error' });
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const body = {
                label: e.target.addrLabel.value,
                fullName: e.target.addrName.value.trim(),
                phone: e.target.addrPhone.value.trim(),
                addressLine1: e.target.addrLine1.value.trim(),
                addressLine2: e.target.addrLine2.value.trim(),
                city: e.target.addrCity.value.trim(),
                state: e.target.addrState.value.trim(),
                pincode: e.target.addrPincode.value.trim(),
                isDefault: e.target.addrDefault.checked,
            };
            const data = await apiRequest('/auth/me/addresses', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            setUser(prev => ({ ...prev, addresses: data.data.addresses }));
            e.target.reset();
            setShowAddressForm(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const deleteAddress = async (id) => {
        if (!confirm('Remove this address?')) return;
        try {
            const data = await apiRequest(`/auth/me/addresses/${id}`, { method: 'DELETE' });
            setUser(prev => ({ ...prev, addresses: data.data.addresses }));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const [showAddressForm, setShowAddressForm] = useState(false);

    if (!isAuthenticated) {
        return (
            <Layout>
                <div style={{ padding: 'var(--space-4xl) 0', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>👤</div>
                    <h2>Please log in to view your profile</h2>
                    <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Sign in to access your orders, addresses, and account settings.</p>
                    <button className="btn btn--primary" style={{ marginTop: 'var(--space-xl)' }} onClick={openAuthModal}>Sign In</button>
                </div>
            </Layout>
        );
    }

    const tabs = ['info', 'password', 'addresses', 'orders'];

    return (
        <Layout>
            <div className="container section">
                <h1 style={{ marginBottom: 'var(--space-xl)' }}>My Account</h1>

                <div className="profile-layout">
                    {/* Sidebar Nav */}
                    <nav className="profile__nav">
                        {tabs.map(tab => (
                            <button key={tab} className={`profile__nav-item ${activeTab === tab ? 'active' : ''}`} data-tab={tab} onClick={() => setActiveTab(tab)}>
                                {tab === 'info' ? '👤 Profile' : tab === 'password' ? '🔒 Password' : tab === 'addresses' ? '📍 Addresses' : '📦 Orders'}
                            </button>
                        ))}
                        {isAdmin && (
                            <Link href="/admin" className="profile__nav-item" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', display: 'block' }}>📊 Admin Dashboard</Link>
                        )}
                        <button className="profile__nav-item" onClick={handleLogout} id="profileLogout">🚪 Logout</button>
                    </nav>

                    {/* Tab Content */}
                    <div className="profile__content">
                        {/* Profile Info */}
                        {activeTab === 'info' && (
                            <div className="profile__tab active" id="tabInfo">
                                <h2>Profile Information</h2>
                                <form id="profileForm" onSubmit={handleProfileUpdate} style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                    <div><label>Full Name</label><input type="text" name="profileName" defaultValue={user?.name || ''} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>Email</label><input type="email" name="profileEmail" defaultValue={user?.email || ''} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>Phone</label><input type="tel" name="profilePhone" defaultValue={user?.phone || ''} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    {profileMsg.text && <div className={`profile__msg ${profileMsg.type}`}>{profileMsg.text}</div>}
                                    <button type="submit" className="btn btn--primary">Save Changes</button>
                                </form>
                            </div>
                        )}

                        {/* Password */}
                        {activeTab === 'password' && (
                            <div className="profile__tab active" id="tabPassword">
                                <h2>Change Password</h2>
                                <form id="passwordForm" onSubmit={handlePasswordChange} style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                    <div><label>Current Password</label><input type="password" name="currentPassword" required style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>New Password</label><input type="password" name="newPassword" required minLength={8} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    <div><label>Confirm New Password</label><input type="password" name="confirmPassword" required minLength={8} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                    {passwordMsg.text && <div className={`profile__msg ${passwordMsg.type}`}>{passwordMsg.text}</div>}
                                    <button type="submit" className="btn btn--primary">Update Password</button>
                                </form>
                            </div>
                        )}

                        {/* Addresses */}
                        {activeTab === 'addresses' && (
                            <div className="profile__tab active" id="tabAddresses">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h2>Saved Addresses</h2>
                                    <button className="btn btn--primary btn--sm" onClick={() => setShowAddressForm(!showAddressForm)} id="addAddressBtn">+ Add Address</button>
                                </div>

                                {showAddressForm && (
                                    <form id="addressForm" onSubmit={handleAddAddress} style={{ background: 'var(--color-bg-alt)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                        <div><label>Label</label><select name="addrLabel" id="addrLabel" style={{ width: '100%', padding: '10px' }}><option>Home</option><option>Work</option><option>Other</option></select></div>
                                        <div><label>Full Name</label><input type="text" name="addrName" id="addrName" required style={{ width: '100%', padding: '10px' }} /></div>
                                        <div><label>Phone</label><input type="tel" name="addrPhone" id="addrPhone" required style={{ width: '100%', padding: '10px' }} /></div>
                                        <div style={{ gridColumn: '1 / -1' }}><label>Address Line 1</label><input type="text" name="addrLine1" id="addrLine1" required style={{ width: '100%', padding: '10px' }} /></div>
                                        <div style={{ gridColumn: '1 / -1' }}><label>Address Line 2</label><input type="text" name="addrLine2" id="addrLine2" style={{ width: '100%', padding: '10px' }} /></div>
                                        <div><label>City</label><input type="text" name="addrCity" id="addrCity" required style={{ width: '100%', padding: '10px' }} /></div>
                                        <div><label>State</label><input type="text" name="addrState" id="addrState" required style={{ width: '100%', padding: '10px' }} /></div>
                                        <div><label>Pincode</label><input type="text" name="addrPincode" id="addrPincode" required style={{ width: '100%', padding: '10px' }} /></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}><input type="checkbox" name="addrDefault" id="addrDefault" /><label htmlFor="addrDefault">Set as default</label></div>
                                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-sm)' }}>
                                            <button type="submit" className="btn btn--primary btn--sm">Save Address</button>
                                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowAddressForm(false)}>Cancel</button>
                                        </div>
                                    </form>
                                )}

                                <div id="addressList">
                                    {(user?.addresses || []).length === 0 ? (
                                        <p style={{ color: 'var(--color-text-muted)' }}>No saved addresses yet.</p>
                                    ) : (
                                        user.addresses.map((addr, i) => (
                                            <div key={addr._id || i} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div>
                                                    <strong>{addr.label}</strong> {addr.isDefault && <span style={{ fontSize: '0.75rem', background: 'var(--color-primary)', color: '#fff', padding: '2px 8px', borderRadius: '12px', marginLeft: 8 }}>Default</span>}
                                                    <p style={{ marginTop: 4, lineHeight: 1.6 }}>{addr.fullName}<br />{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}<br />{addr.city}, {addr.state} - {addr.pincode}<br />📞 {addr.phone}</p>
                                                </div>
                                                <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteAddress(addr._id)}>Remove</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Orders */}
                        {activeTab === 'orders' && (
                            <div className="profile__tab active" id="tabOrders">
                                <h2>Order History</h2>
                                {orders.length === 0 ? (
                                    <p style={{ marginTop: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>No orders yet.</p>
                                ) : (
                                    <div style={{ marginTop: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                        {orders.map(order => (
                                            <div key={order._id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                                    <strong>{order.orderNumber}</strong>
                                                    <span className={`badge badge--${order.status}`} style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', textTransform: 'capitalize', background: order.status === 'delivered' ? 'var(--color-success)' : order.status === 'cancelled' ? 'var(--color-error)' : 'var(--color-primary)', color: '#fff' }}>{order.status}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                        {order.items?.length || 0} items · ₹{order.total} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                                    </div>
                                                    <button className="btn btn--ghost btn--sm" onClick={() => router.push(`/profile/orders/${order._id}`)} style={{ fontSize: '0.85rem' }}>View Details →</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
