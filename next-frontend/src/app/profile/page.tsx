'use client';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import '../../styles/profile.css';
import type { FormEvent } from 'react';
import type { OrderSummary, UserAddress, UserProfile } from '../../types/app';

type FormMessage = {
    text: string;
    type: '' | 'success' | 'error';
};

function getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback;
}

export default function Profile() {
    const { user, isAuthenticated, isAdmin, openAuthModal, logout, updateProfile, setUser } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('info');
    const [profileMsg, setProfileMsg] = useState<FormMessage>({ text: '', type: '' });
    const [passwordMsg, setPasswordMsg] = useState<FormMessage>({ text: '', type: '' });
    const [orders, setOrders] = useState<OrderSummary[]>([]);

    // Read ?tab= query param for deep-linking (e.g. footer "Track Order")
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') === 'orders') setActiveTab('orders');
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        (async () => {
            try {
                const data = await apiRequest('/orders');
                setOrders((data.data || []) as OrderSummary[]);
            } catch (err) {
                console.error('Failed to load orders:', err);
            }
        })();
    }, [isAuthenticated]);

    const handleProfileUpdate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProfileMsg({ text: '', type: '' });
        const formData = new FormData(e.currentTarget);
        try {
            const name = String(formData.get('profileName') || '').trim();
            const email = String(formData.get('profileEmail') || '').trim();
            const phone = String(formData.get('profilePhone') || '').trim();
            const updates: Record<string, string> = { name, email, phone };
            // Backend requires currentPassword when changing email
            if (email !== user?.email) {
                const pw = String(formData.get('profileCurrentPassword') || '');
                if (!pw) { setProfileMsg({ text: 'Current password is required to change email', type: 'error' }); return; }
                updates.currentPassword = pw;
            }
            await updateProfile(updates);
            setProfileMsg({ text: 'Profile updated!', type: 'success' });
        } catch (err) {
            setProfileMsg({ text: getErrorMessage(err, 'Failed to update profile'), type: 'error' });
        }
    };

    const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordMsg({ text: '', type: '' });
        const formData = new FormData(e.currentTarget);
        const currentPassword = String(formData.get('currentPassword') || '');
        const newPassword = String(formData.get('newPassword') || '');
        const confirmPassword = String(formData.get('confirmPassword') || '');
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
            e.currentTarget.reset();
        } catch (err) {
            setPasswordMsg({ text: getErrorMessage(err, 'Failed to update password'), type: 'error' });
        }
    };

    const handleAddAddress = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            const body = {
                label: String(formData.get('addrLabel') || ''),
                fullName: String(formData.get('addrName') || '').trim(),
                phone: String(formData.get('addrPhone') || '').trim(),
                addressLine1: String(formData.get('addrLine1') || '').trim(),
                addressLine2: String(formData.get('addrLine2') || '').trim(),
                city: String(formData.get('addrCity') || '').trim(),
                state: String(formData.get('addrState') || '').trim(),
                pincode: String(formData.get('addrPincode') || '').trim(),
                isDefault: formData.get('addrDefault') === 'on',
            };
            const data = await apiRequest('/auth/me/addresses', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            setUser((prev: UserProfile | null) => (prev ? { ...prev, addresses: data.data.addresses as UserAddress[] } : prev));
            e.currentTarget.reset();
            setShowAddressForm(false);
        } catch (err) {
            showToast(getErrorMessage(err, 'Failed to save address'), 'error');
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            const data = await apiRequest(`/auth/me/addresses/${id}`, { method: 'DELETE' });
            setUser((prev: UserProfile | null) => (prev ? { ...prev, addresses: data.data.addresses as UserAddress[] } : prev));
        } catch (err) {
            showToast(getErrorMessage(err, 'Failed to remove address'), 'error');
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const [showAddressForm, setShowAddressForm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const tabs = [
        { key: 'info', label: 'Profile', icon: '👤' },
        { key: 'password', label: 'Password', icon: '🔒' },
        { key: 'addresses', label: 'Addresses', icon: '📍' },
        { key: 'orders', label: 'Orders', icon: '📦' },
    ];

    const formatOrderDate = (value: string) => {
        try {
            return new Date(value).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return value;
        }
    };

    if (!isAuthenticated) {
        return (
            <Layout>
                <div className="container section">
                    <EmptyState icon="👤" iconSize="lg" title="Please sign in" message="Sign in to access your orders, addresses, and account settings." actionLabel="Sign In" onAction={openAuthModal} />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="page-hero page-hero--compact">
                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span>/</span> <span>My Account</span></nav>
                    <p className="overline">Account Center</p>
                    <h1>My Account</h1>
                    <p>Manage your profile, addresses, password, and orders in one place.</p>
                </div>
            </div>

            <div className="container section">
                <div className="profile">
                    <aside className="profile__sidebar">
                        <div className="profile__avatar">{(user?.name?.charAt(0) || 'U').toUpperCase()}</div>
                        <div className="profile__name">{user?.name || 'Guest User'}</div>
                        <div className="profile__email">{user?.email || 'No email'}</div>

                        <nav className="profile__nav" aria-label="Profile sections">
                            {tabs.map(tab => (
                                <button key={tab.key} className={`profile__nav-item ${activeTab === tab.key ? 'active' : ''}`} data-tab={tab.key} onClick={() => setActiveTab(tab.key)}>
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}

                            {isAdmin && (
                                <Link href="/admin" className="profile__nav-item">
                                    <span>📊</span>
                                    <span>Admin Dashboard</span>
                                </Link>
                            )}
                        </nav>

                        <button className="profile__logout" onClick={handleLogout} id="profileLogout">🚪 Logout</button>
                    </aside>

                    <div className="profile__main">
                        {/* Profile Info */}
                        {activeTab === 'info' && (
                            <div className="profile__tab active" id="tabInfo">
                                <h2 className="profile__section-title">Profile Information</h2>
                                <form id="profileForm" onSubmit={handleProfileUpdate} className="profile__form profile__card">
                                    <div className="profile__field">
                                        <label htmlFor="profileName">Full Name</label>
                                        <input id="profileName" type="text" name="profileName" defaultValue={user?.name || ''} />
                                    </div>
                                    <div className="profile__field">
                                        <label htmlFor="profileEmail">Email</label>
                                        <input id="profileEmail" type="email" name="profileEmail" defaultValue={user?.email || ''} />
                                    </div>
                                    <div className="profile__field">
                                        <label htmlFor="profilePhone">Phone</label>
                                        <input id="profilePhone" type="tel" name="profilePhone" defaultValue={user?.phone || ''} />
                                    </div>
                                    <div className="profile__field">
                                        <label htmlFor="profileCurrentPassword">Current Password <span className="profile__hint">(required to change email)</span></label>
                                        <input id="profileCurrentPassword" type="password" name="profileCurrentPassword" placeholder="Enter only if changing email" />
                                    </div>
                                    {profileMsg.text && <div className={`profile__msg ${profileMsg.type}`}>{profileMsg.text}</div>}
                                    <div className="profile__form-actions">
                                        <button type="submit" className="btn btn--primary">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Password */}
                        {activeTab === 'password' && (
                            <div className="profile__tab active" id="tabPassword">
                                <h2 className="profile__section-title">Change Password</h2>
                                <form id="passwordForm" onSubmit={handlePasswordChange} className="profile__form profile__card">
                                    <div className="profile__field">
                                        <label htmlFor="currentPassword">Current Password</label>
                                        <input id="currentPassword" type="password" name="currentPassword" required />
                                    </div>
                                    <div className="profile__field">
                                        <label htmlFor="newPassword">New Password</label>
                                        <input id="newPassword" type="password" name="newPassword" required minLength={8} />
                                    </div>
                                    <div className="profile__field">
                                        <label htmlFor="confirmPassword">Confirm New Password</label>
                                        <input id="confirmPassword" type="password" name="confirmPassword" required minLength={8} />
                                    </div>
                                    {passwordMsg.text && <div className={`profile__msg ${passwordMsg.type}`}>{passwordMsg.text}</div>}
                                    <div className="profile__form-actions">
                                        <button type="submit" className="btn btn--primary">Update Password</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Addresses */}
                        {activeTab === 'addresses' && (
                            <div className="profile__tab active" id="tabAddresses">
                                <div className="profile__section-header">
                                    <h2 className="profile__section-title">Saved Addresses</h2>
                                    <button className="btn btn--primary btn--sm" onClick={() => setShowAddressForm(!showAddressForm)} id="addAddressBtn">+ Add Address</button>
                                </div>

                                {showAddressForm && (
                                    <div className="profile__address-form">
                                        <h4>Add New Address</h4>
                                        <form id="addressForm" onSubmit={handleAddAddress} className="profile__form">
                                            <div className="profile__form-row">
                                                <div className="profile__field">
                                                    <label htmlFor="addrLabel">Label</label>
                                                    <select name="addrLabel" id="addrLabel"><option>Home</option><option>Work</option><option>Other</option></select>
                                                </div>
                                                <div className="profile__field">
                                                    <label htmlFor="addrName">Full Name</label>
                                                    <input type="text" name="addrName" id="addrName" required />
                                                </div>
                                            </div>
                                            <div className="profile__form-row">
                                                <div className="profile__field">
                                                    <label htmlFor="addrPhone">Phone</label>
                                                    <input type="tel" name="addrPhone" id="addrPhone" required />
                                                </div>
                                                <div className="profile__field">
                                                    <label htmlFor="addrPincode">Pincode</label>
                                                    <input type="text" name="addrPincode" id="addrPincode" required />
                                                </div>
                                            </div>
                                            <div className="profile__field">
                                                <label htmlFor="addrLine1">Address Line 1</label>
                                                <input type="text" name="addrLine1" id="addrLine1" required />
                                            </div>
                                            <div className="profile__field">
                                                <label htmlFor="addrLine2">Address Line 2</label>
                                                <input type="text" name="addrLine2" id="addrLine2" />
                                            </div>
                                            <div className="profile__form-row">
                                                <div className="profile__field">
                                                    <label htmlFor="addrCity">City</label>
                                                    <input type="text" name="addrCity" id="addrCity" required />
                                                </div>
                                                <div className="profile__field">
                                                    <label htmlFor="addrState">State</label>
                                                    <input type="text" name="addrState" id="addrState" required />
                                                </div>
                                            </div>
                                            <label className="profile__checkbox"><input type="checkbox" name="addrDefault" id="addrDefault" /><span>Set as default address</span></label>
                                            <div className="profile__form-actions">
                                                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowAddressForm(false)}>Cancel</button>
                                            <button type="submit" className="btn btn--primary btn--sm">Save Address</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div id="addressList" className="profile__addresses">
                                    {(user?.addresses || []).length === 0 ? (
                                        <p className="profile__empty">No saved addresses yet.</p>
                                    ) : (
                                        (user?.addresses ?? []).map((addr: UserAddress, i: number) => (
                                            <div key={addr._id || i} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                                                <div>
                                                    <div>
                                                        <span className="address-card__label">{addr.label}</span>
                                                        {addr.isDefault && <span className="address-card__default">Default</span>}
                                                    </div>
                                                    <div className="address-card__name">{addr.fullName}</div>
                                                    <p className="address-card__text">{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}<br />{addr.city}, {addr.state} - {addr.pincode}<br />📞 {addr.phone}</p>
                                                </div>
                                                {pendingDeleteId === (addr._id || String(i)) ? (
                                                    <div className="address-card__actions">
                                                        <button className="address-card__btn address-card__btn--delete" onClick={() => { if (addr._id) deleteAddress(addr._id); setPendingDeleteId(null); }}>Confirm</button>
                                                        <button className="address-card__btn" onClick={() => setPendingDeleteId(null)}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="address-card__actions">
                                                        <button className="address-card__btn address-card__btn--delete" onClick={() => setPendingDeleteId(addr._id || String(i))}>Remove</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Orders */}
                        {activeTab === 'orders' && (
                            <div className="profile__tab active" id="tabOrders">
                                <h2 className="profile__section-title">Order History</h2>
                                {orders.length === 0 ? (
                                    <p className="profile__empty">No orders yet.</p>
                                ) : (
                                    <div>
                                        {orders.map((order: OrderSummary) => (
                                            <div key={order._id} className="order-card">
                                                <div className="order-card__header">
                                                    <div>
                                                        <div className="order-card__number">{order.orderNumber}</div>
                                                        <div className="order-card__date">{formatOrderDate(order.createdAt)}</div>
                                                    </div>
                                                    <span className={`order-status order-status--${order.status}`}>{order.status}</span>
                                                </div>
                                                <div className="order-card__items">{order.items?.length || 0} items</div>
                                                <div className="order-card__footer">
                                                    <div className="order-card__total">₹{order.total}</div>
                                                    <button className="btn btn--ghost btn--sm" onClick={() => router.push(`/profile/orders/${order._id}`)}>View Details →</button>
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
