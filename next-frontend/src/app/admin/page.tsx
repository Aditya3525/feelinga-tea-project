'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import '../../styles/admin.css';

export default function Admin() {
    const { isAuthenticated, isAdmin, user } = useAuth();
    const [token, setToken] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('feelinga_token') : null);
    const [currentUser, setCurrentUser] = useState(null);
    const [gateError, setGateError] = useState('');
    const [activeSection, setActiveSection] = useState('overview');

    // Dashboard data
    const [overview, setOverview] = useState(null);
    const [products, setProducts] = useState([]);
    const [productPagination, setProductPagination] = useState({ page: 1, totalPages: 1 });
    const [orders, setOrders] = useState([]);
    const [orderPagination, setOrderPagination] = useState({ page: 1, totalPages: 1 });
    const [activity, setActivity] = useState([]);

    // Admin login for non-authenticated users
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const adminApi = useCallback(async (path, options = {}) => {
        const tkn = localStorage.getItem('feelinga_token');
        const res = await fetch(`/api/v1${path}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tkn}`, ...options.headers },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
    }, []);

    const checkAuth = useCallback(async () => {
        const tkn = localStorage.getItem('feelinga_token');
        if (!tkn) { setCurrentUser(null); return; }
        try {
            const data = await adminApi('/auth/me');
            if (data.data.user.role !== 'admin') throw new Error('Admin access required');
            setCurrentUser(data.data.user);
        } catch {
            setCurrentUser(null);
        }
    }, [adminApi]);

    useEffect(() => { checkAuth(); }, [checkAuth]);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setGateError('');
        try {
            const data = await adminApi('/auth/login', { method: 'POST', body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
            if (data.data.user.role !== 'admin') throw new Error('Admin access required');
            localStorage.setItem('feelinga_token', data.data.accessToken);
            localStorage.setItem('feelinga_refresh', data.data.refreshToken);
            localStorage.setItem('feelinga_user', JSON.stringify(data.data.user));
            setCurrentUser(data.data.user);
        } catch (err) {
            setGateError(err.message);
        }
    };

    // Load data when we have an admin user
    useEffect(() => {
        if (!currentUser) return;
        loadOverview();
        loadProducts();
        loadOrders();
        loadActivity();
    }, [currentUser]);

    const loadOverview = async () => {
        try {
            const data = await adminApi('/admin/dashboard');
            setOverview(data.data);
        } catch (err) { console.error(err); }
    };

    const loadProducts = async (page = 1) => {
        try {
            const data = await adminApi(`/products?page=${page}&limit=10`);
            setProducts(data.data || []);
            setProductPagination(data.pagination || { page: 1, totalPages: 1 });
        } catch (err) { console.error(err); }
    };

    const loadOrders = async (page = 1) => {
        try {
            const data = await adminApi(`/orders?page=${page}&limit=10`);
            setOrders(data.data || []);
            setOrderPagination(data.pagination || { page: 1, totalPages: 1 });
        } catch (err) { console.error(err); }
    };

    const loadActivity = async () => {
        try {
            const data = await adminApi('/admin/activity');
            setActivity(data.data || []);
        } catch (err) { console.error(err); }
    };

    const updateOrderStatus = async (id, status) => {
        try {
            await adminApi(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
            loadOrders(orderPagination.page);
        } catch (err) { alert(err.message); }
    };

    const deleteProduct = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try {
            await adminApi(`/products/${id}`, { method: 'DELETE' });
            loadProducts(productPagination.page);
        } catch (err) { alert(err.message); }
    };

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6', shipped: '#6366f1', delivered: '#10b981', cancelled: '#ef4444' };

    // Auth Gate
    if (!currentUser) {
        return (
            <div className="admin-gate" id="adminGate">
                <div className="admin-gate__card">
                    <h1>🔐 Admin Access</h1>
                    <p>Sign in with your admin credentials</p>
                    {gateError && <div className="admin-gate__error" id="gateError">{gateError}</div>}
                    <form id="adminLoginForm" onSubmit={handleAdminLogin}>
                        <input type="email" placeholder="Admin email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                        <input type="password" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                        <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>Sign In</button>
                    </form>
                </div>
            </div>
        );
    }

    const navItems = [
        { key: 'overview', icon: '📊', label: 'Overview' },
        { key: 'products', icon: '🍵', label: 'Products' },
        { key: 'orders', icon: '📦', label: 'Orders' },
        { key: 'activity', icon: '📋', label: 'Activity' },
    ];

    return (
        <div className="admin" id="adminDashboard">
            {/* Sidebar */}
            <aside className="admin__sidebar" id="adminSidebar">
                <div className="admin__sidebar-header">
                    <div className="admin__logo">feelinga<span>.</span> admin</div>
                    <div className="admin__user-info">
                        <div className="admin__user-name">{currentUser.name}</div>
                        <div className="admin__user-role">Administrator</div>
                    </div>
                </div>
                <nav className="admin__nav">
                    {navItems.map(item => (
                        <button key={item.key} className={`admin__nav-item ${activeSection === item.key ? 'active' : ''}`} data-section={item.key} onClick={() => setActiveSection(item.key)}>
                            <span>{item.icon}</span> {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="admin__main">
                <header className="admin__header">
                    <h1 id="pageTitle">{capitalize(activeSection)}</h1>
                </header>

                <div className="admin__content">
                    {/* OVERVIEW */}
                    {activeSection === 'overview' && overview && (
                        <div className="admin__section active" id="sectionOverview">
                            <div className="admin__kpis">
                                <div className="kpi-card"><div className="kpi-card__value">{overview.totals.users}</div><div className="kpi-card__label">Total Users</div></div>
                                <div className="kpi-card"><div className="kpi-card__value">{overview.totals.products}</div><div className="kpi-card__label">Products</div></div>
                                <div className="kpi-card"><div className="kpi-card__value">{overview.totals.orders}</div><div className="kpi-card__label">Orders</div></div>
                                <div className="kpi-card"><div className="kpi-card__value">₹{(overview.totals.revenue || 0).toLocaleString()}</div><div className="kpi-card__label">Revenue</div></div>
                            </div>

                            {overview.statusBreakdown && Object.keys(overview.statusBreakdown).length > 0 && (
                                <div className="admin__card" style={{ marginTop: 'var(--space-xl)' }}>
                                    <h3>Order Status Breakdown</h3>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-md)' }}>
                                        {Object.entries(overview.statusBreakdown).map(([status, count]) => (
                                            <div key={status} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: statusColors[status] || '#888', color: '#fff', fontWeight: 600 }}>
                                                {capitalize(status)}: {count}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {overview.recentOrders?.length > 0 && (
                                <div className="admin__card" style={{ marginTop: 'var(--space-xl)' }}>
                                    <h3>Recent Orders</h3>
                                    <table className="admin__table" style={{ marginTop: 'var(--space-md)' }}>
                                        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {overview.recentOrders.map(order => (
                                                <tr key={order._id}>
                                                    <td>{order.orderNumber}</td>
                                                    <td>{order.user?.name || 'N/A'}</td>
                                                    <td>₹{order.total}</td>
                                                    <td><span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', background: statusColors[order.status] || '#888', color: '#fff' }}>{order.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PRODUCTS */}
                    {activeSection === 'products' && (
                        <div className="admin__section active" id="sectionProducts">
                            <table className="admin__table">
                                <thead><tr><th>Name</th><th>Type</th><th>Price (100g)</th><th>Stock</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p._id}>
                                            <td>{p.name}</td>
                                            <td>{p.type}</td>
                                            <td>₹{p.prices?.['100g'] || '-'}</td>
                                            <td>{p.stock}</td>
                                            <td>
                                                <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteProduct(p._id, p.name)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {productPagination.totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 'var(--space-lg)' }}>
                                    {Array.from({ length: productPagination.totalPages }, (_, i) => (
                                        <button key={i} className={`btn btn--sm ${productPagination.page === i + 1 ? 'btn--primary' : 'btn--ghost'}`} onClick={() => loadProducts(i + 1)}>{i + 1}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ORDERS */}
                    {activeSection === 'orders' && (
                        <div className="admin__section active" id="sectionOrders">
                            <table className="admin__table">
                                <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td>{order.orderNumber}</td>
                                            <td>{order.user?.name || order.user?.email || 'N/A'}</td>
                                            <td>₹{order.total}</td>
                                            <td><span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', background: statusColors[order.status] || '#888', color: '#fff' }}>{order.status}</span></td>
                                            <td>
                                                <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                        <option key={s} value={s}>{capitalize(s)}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {orderPagination.totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 'var(--space-lg)' }}>
                                    {Array.from({ length: orderPagination.totalPages }, (_, i) => (
                                        <button key={i} className={`btn btn--sm ${orderPagination.page === i + 1 ? 'btn--primary' : 'btn--ghost'}`} onClick={() => loadOrders(i + 1)}>{i + 1}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACTIVITY */}
                    {activeSection === 'activity' && (
                        <div className="admin__section active" id="sectionActivity">
                            <div className="activity-feed">
                                {activity.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)' }}>No activity yet.</p>
                                ) : (
                                    activity.map((item, i) => (
                                        <div key={i} className="activity-item" style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <strong>{item.summary}</strong>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(item.createdAt).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                                                {item.actorName} · {item.action}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

