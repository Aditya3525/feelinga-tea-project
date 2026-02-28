'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import '../../styles/admin.css';

export default function Admin() {
    const { isAuthenticated, isAdmin, user, authReady, login: authLogin } = useAuth();
    const [currentUser, setCurrentUser] = useState(null);
    const [gateError, setGateError] = useState('');
    const [activeSection, setActiveSection] = useState('overview');

    // Dashboard data
    const [overview, setOverview] = useState(null);
    const [products, setProducts] = useState([]);
    const [productPagination, setProductPagination] = useState({ page: 1, totalPages: 1 });
    const [orders, setOrders] = useState([]);
    const [orderPagination, setOrderPagination] = useState({ page: 1, totalPages: 1 });
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('');
    const [activity, setActivity] = useState([]);

    // Users state
    const [users, setUsers] = useState([]);
    const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [userSearch, setUserSearch] = useState('');

    // Low-stock alerts
    const [lowStockProducts, setLowStockProducts] = useState([]);

    // Messages (contact submissions)
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);

    // Newsletter subscribers
    const [subscribers, setSubscribers] = useState([]);
    const [subscribersLoading, setSubscribersLoading] = useState(false);

    // Coupons
    const [coupons, setCoupons] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(false);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const emptyCoupon = { code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', perUserLimit: '', validFrom: '', validTo: '', active: true };
    const [couponForm, setCouponForm] = useState(emptyCoupon);

    // Testimonials
    const [testimonials, setTestimonials] = useState([]);
    const [testimonialsLoading, setTestimonialsLoading] = useState(false);
    const [showTestimonialForm, setShowTestimonialForm] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState(null);
    const emptyTestimonial = { author: '', role: '', text: '', rating: 5, approved: false, featured: false, order: 0 };
    const [testimonialForm, setTestimonialForm] = useState(emptyTestimonial);

    // Product form state
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const emptyProduct = {
        name: '', slug: '', type: 'Black Tea', description: '', shortDescription: '', origin: '',
        'price50g': '', 'price100g': '', 'price200g': '',
        stock: 100, caffeine: 'medium', tastingNotes: '', tags: '', images: [],
        moods: [], isBestSeller: false, isNewArrival: true, inStock: true
    };
    const [productForm, setProductForm] = useState(emptyProduct);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // Admin login for non-authenticated users
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const adminApi = useCallback(async (path: string, options: any = {}) => {
        return apiRequest(path, options);
    }, []);

    // Sync admin currentUser with AuthContext — single source of truth
    // Wait for authReady so we don't fire API calls with a stale/expired token
    useEffect(() => {
        if (!authReady) return;
        if (isAdmin && user) {
            setCurrentUser(user);
        } else {
            // Not authenticated OR not admin — show login gate
            setCurrentUser(null);
        }
    }, [authReady, isAuthenticated, isAdmin, user]);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setGateError('');
        try {
            const data = await authLogin(loginEmail, loginPassword);
            if (data.data.user.role !== 'admin') throw new Error('Admin access required');
            setCurrentUser(data.data.user);
        } catch (err) {
            setGateError(err.message);
        }
    };

    // Load only overview data when we have an admin user
    useEffect(() => {
        if (!currentUser) return;
        loadOverview();
        loadLowStock();
    }, [currentUser]);

    // Lazy-load tab data when tab changes
    useEffect(() => {
        if (!currentUser) return;
        if (activeSection === 'products') loadProducts();
        else if (activeSection === 'orders') loadOrders();
        else if (activeSection === 'users') loadUsers();
        else if (activeSection === 'activity') loadActivity();
        else if (activeSection === 'messages') loadMessages();
        else if (activeSection === 'newsletter') loadSubscribers();
        else if (activeSection === 'coupons') loadCoupons();
        else if (activeSection === 'testimonials') loadTestimonials();
        else if (activeSection === 'testimonials') loadTestimonials();
    }, [activeSection, currentUser]);

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

    const loadOrders = async (page = 1, search = orderSearch, status = orderStatusFilter) => {
        try {
            let url = `/orders?page=${page}&limit=10`;
            if (search) url += `&q=${encodeURIComponent(search)}`;
            if (status) url += `&status=${status}`;
            const data = await adminApi(url);
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

    const loadUsers = async (page = 1, search = '') => {
        try {
            const data = await adminApi(`/admin/users?page=${page}&limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}`);
            setUsers(data.data || []);
            setUserPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (err) { console.error(err); }
    };

    const loadLowStock = async () => {
        try {
            const data = await adminApi('/admin/low-stock?threshold=10');
            setLowStockProducts(data.data || []);
        } catch (err) { console.error(err); }
    };

    const loadMessages = async () => {
        setMessagesLoading(true);
        try {
            const data = await adminApi('/contact');
            setMessages(data.data || []);
        } catch (err) { console.error(err); }
        finally { setMessagesLoading(false); }
    };

    const loadSubscribers = async () => {
        setSubscribersLoading(true);
        try {
            const data = await adminApi('/newsletter');
            setSubscribers(data.data || []);
        } catch (err) { console.error(err); }
        finally { setSubscribersLoading(false); }
    };

    const loadCoupons = async () => {
        setCouponsLoading(true);
        try {
            const data = await adminApi('/admin/coupons');
            setCoupons(data.data || []);
        } catch (err) { console.error(err); }
        finally { setCouponsLoading(false); }
    };

    const loadTestimonials = async () => {
        setTestimonialsLoading(true);
        try {
            const data = await adminApi('/admin/testimonials');
            setTestimonials(data.data || []);
        } catch (err) { console.error(err); }
        finally { setTestimonialsLoading(false); }
    };

    const handleTestimonialSubmit = async (e) => {
        e.preventDefault();
        const body = {
            author: testimonialForm.author.trim(),
            role: testimonialForm.role.trim() || 'Customer',
            text: testimonialForm.text.trim(),
            rating: Number(testimonialForm.rating),
            approved: testimonialForm.approved,
            featured: testimonialForm.featured,
            order: Number(testimonialForm.order) || 0,
        };
        try {
            if (editingTestimonial) {
                await adminApi(`/admin/testimonials/${editingTestimonial._id}`, { method: 'PATCH', body: JSON.stringify(body) });
            } else {
                await adminApi('/admin/testimonials', { method: 'POST', body: JSON.stringify(body) });
            }
            setShowTestimonialForm(false);
            setEditingTestimonial(null);
            setTestimonialForm(emptyTestimonial);
            loadTestimonials();
        } catch (err) { alert(err.message); }
    };

    const deleteTestimonial = async (id) => {
        if (!confirm('Delete this testimonial?')) return;
        try {
            await adminApi(`/admin/testimonials/${id}`, { method: 'DELETE' });
            loadTestimonials();
        } catch (err) { alert(err.message); }
    };

    const toggleTestimonialApproval = async (testimonial) => {
        try {
            await adminApi(`/admin/testimonials/${testimonial._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ approved: !testimonial.approved }),
            });
            loadTestimonials();
        } catch (err) { alert(err.message); }
    };

    const toggleTestimonialFeatured = async (testimonial) => {
        try {
            await adminApi(`/admin/testimonials/${testimonial._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ featured: !testimonial.featured }),
            });
            loadTestimonials();
        } catch (err) { alert(err.message); }
    };

    const openEditTestimonial = (t) => {
        setEditingTestimonial(t);
        setTestimonialForm({
            author: t.author || '',
            role: t.role || '',
            text: t.text || '',
            rating: t.rating || 5,
            approved: t.approved || false,
            featured: t.featured || false,
            order: t.order || 0,
        });
        setShowTestimonialForm(true);
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        const body = {
            code: couponForm.code.toUpperCase().trim(),
            discountType: couponForm.discountType,
            discountValue: Number(couponForm.discountValue),
            minOrderAmount: couponForm.minOrderAmount ? Number(couponForm.minOrderAmount) : undefined,
            maxDiscount: couponForm.maxDiscount ? Number(couponForm.maxDiscount) : undefined,
            usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
            perUserLimit: couponForm.perUserLimit ? Number(couponForm.perUserLimit) : undefined,
            validFrom: couponForm.validFrom || undefined,
            validTo: couponForm.validTo || undefined,
            active: couponForm.active,
        };
        try {
            if (editingCoupon) {
                await adminApi(`/admin/coupons/${editingCoupon._id}`, { method: 'PATCH', body: JSON.stringify(body) });
            } else {
                await adminApi('/admin/coupons', { method: 'POST', body: JSON.stringify(body) });
            }
            setShowCouponForm(false);
            setEditingCoupon(null);
            setCouponForm(emptyCoupon);
            loadCoupons();
        } catch (err) { alert(err.message); }
    };

    const deleteCoupon = async (id) => {
        if (!confirm('Delete this coupon?')) return;
        try {
            await adminApi(`/admin/coupons/${id}`, { method: 'DELETE' });
            loadCoupons();
        } catch (err) { alert(err.message); }
    };

    const openEditCoupon = (c) => {
        setEditingCoupon(c);
        setCouponForm({
            code: c.code || '',
            discountType: c.discountType || 'percentage',
            discountValue: c.discountValue || '',
            minOrderAmount: c.minOrderAmount || '',
            maxDiscount: c.maxDiscount || '',
            usageLimit: c.usageLimit || '',
            perUserLimit: c.perUserLimit || '',
            validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
            validTo: c.validTo ? c.validTo.slice(0, 10) : '',
            active: c.active !== false,
        });
        setShowCouponForm(true);
    };

    const changeUserRole = async (userId, newRole) => {
        if (!confirm(`Change this user's role to "${newRole}"?`)) return;
        setActionLoading(`role-${userId}`);
        try {
            await adminApi(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
            loadUsers(userPagination.page, userSearch);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const exportCSV = async (type) => {
        setActionLoading(`export-${type}`);
        try {
            const tkn = localStorage.getItem('feelinga_token');
            const res = await fetch(`/api/v1/admin/export/${type}`, {
                headers: { Authorization: `Bearer ${tkn}` },
            });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const downloadInvoice = async (orderId) => {
        setActionLoading(`invoice-${orderId}`);
        try {
            const tkn = localStorage.getItem('feelinga_token');
            const res = await fetch(`/api/v1/admin/invoice/${orderId}`, {
                headers: { Authorization: `Bearer ${tkn}` },
            });
            if (!res.ok) throw new Error('Invoice generation failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${orderId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const updateOrderStatus = async (id, status) => {
        setActionLoading(`status-${id}`);
        try {
            await adminApi(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
            loadOrders(orderPagination.page);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const updateTracking = async (orderId, trackingNumber, trackingUrl) => {
        setActionLoading(`tracking-${orderId}`);
        try {
            await adminApi(`/admin/orders/${orderId}/tracking`, {
                method: 'PATCH',
                body: JSON.stringify({ trackingNumber, trackingUrl }),
            });
            loadOrders(orderPagination.page);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const deleteProduct = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        setActionLoading(`del-${id}`);
        try {
            await adminApi(`/products/${id}`, { method: 'DELETE' });
            loadProducts(productPagination.page);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const openCreateProduct = () => {
        setEditingProduct(null);
        setProductForm(emptyProduct);
        setShowProductForm(true);
    };

    const openEditProduct = (p) => {
        setEditingProduct(p);
        setProductForm({
            name: p.name || '',
            slug: p.slug || '',
            type: p.type || 'Black Tea',
            description: p.description || '',
            shortDescription: p.shortDescription || '',
            origin: p.origin || '',
            'price50g': p.prices?.['50g'] || '',
            'price100g': p.prices?.['100g'] || '',
            'price200g': p.prices?.['200g'] || '',
            stock: p.stock ?? 100,
            caffeine: p.caffeine || 'medium',
            tastingNotes: (p.tastingNotes || []).join(', '),
            tags: (p.tags || []).join(', '),
            images: p.images || [],
            moods: p.moods || [],
            isBestSeller: p.isBestSeller || false,
            isNewArrival: p.isNewArrival || false,
            inStock: p.inStock !== false,
        });
        setShowProductForm(true);
    };

    const handleProductFormChange = (field, value) => {
        setProductForm(prev => ({ ...prev, [field]: value }));
    };

    const toggleMood = (mood) => {
        setProductForm(prev => ({
            ...prev,
            moods: prev.moods.includes(mood) ? prev.moods.filter(m => m !== mood) : [...prev.moods, mood],
        }));
    };

    const uploadImages = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
            const tkn = localStorage.getItem('feelinga_token');
            const res = await fetch('/api/v1/upload/images', {
                method: 'POST',
                headers: { Authorization: `Bearer ${tkn}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            setProductForm(prev => ({ ...prev, images: [...prev.images, ...data.data.urls] }));
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setProductForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer?.files;
        if (files?.length) uploadImages(files);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const body = {
            name: productForm.name.trim(),
            slug: productForm.slug.trim() || productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            type: productForm.type,
            description: productForm.description.trim(),
            shortDescription: productForm.shortDescription.trim() || undefined,
            origin: productForm.origin.trim(),
            prices: {
                ...(productForm['price50g'] ? { '50g': Number(productForm['price50g']) } : {}),
                '100g': Number(productForm['price100g']),
                ...(productForm['price200g'] ? { '200g': Number(productForm['price200g']) } : {}),
            },
            stock: Number(productForm.stock),
            caffeine: productForm.caffeine,
            tastingNotes: productForm.tastingNotes ? productForm.tastingNotes.split(',').map(s => s.trim()).filter(Boolean) : [],
            tags: productForm.tags ? productForm.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
            images: productForm.images,
            moods: productForm.moods,
            isBestSeller: productForm.isBestSeller,
            isNewArrival: productForm.isNewArrival,
            inStock: productForm.inStock,
        };
        try {
            if (editingProduct) {
                await adminApi(`/products/${editingProduct._id}`, { method: 'PATCH', body: JSON.stringify(body) });
            } else {
                await adminApi('/products', { method: 'POST', body: JSON.stringify(body) });
            }
            setShowProductForm(false);
            loadProducts(productPagination.page);
        } catch (err) {
            alert(err.message);
        }
    };

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6', shipped: '#6366f1', delivered: '#10b981', cancelled: '#ef4444' };

    // Loading while verifying session
    if (!authReady) {
        return (
            <div className="admin-gate" id="adminGate">
                <div className="admin-gate__card" style={{ textAlign: 'center' }}>
                    <Image src="/images/logo.png" alt="Feelinga" width={72} height={72} style={{ borderRadius: '50%', margin: '0 auto var(--space-md)', display: 'block', objectFit: 'cover' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>Verifying session…</p>
                </div>
            </div>
        );
    }

    // Auth Gate
    if (!currentUser) {
        return (
            <div className="admin-gate" id="adminGate">
                <div className="admin-gate__card">
                    <Image src="/images/logo.png" alt="Feelinga" width={72} height={72} style={{ borderRadius: '50%', margin: '0 auto var(--space-md)', display: 'block', objectFit: 'cover' }} />
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
        { key: 'users', icon: '👥', label: 'Users' },
        { key: 'coupons', icon: '🎟️', label: 'Coupons' },
        { key: 'testimonials', icon: '⭐', label: 'Reviews' },
        { key: 'messages', icon: '💬', label: 'Messages' },
        { key: 'newsletter', icon: '📧', label: 'Newsletter' },
        { key: 'activity', icon: '📋', label: 'Activity' },
    ];

    return (
        <div className="admin" id="adminDashboard">
            {/* Sidebar */}
            <aside className="admin__sidebar" id="adminSidebar">
                <div className="admin__sidebar-header">
                    <div className="admin__logo">
                        <Image src="/images/logo.png" alt="" width={32} height={32} className="admin__logo-img" />
                        <span>Feelinga<span style={{ color: 'var(--color-accent)' }}>.</span> admin</span>
                    </div>
                </div>
                <div className="admin__user-info">
                    <div className="admin__user-avatar">{currentUser.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="admin__user-meta">
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
                            {/* KPI Stats */}
                            <div className="admin__stats">
                                <div className="stat-card">
                                    <div className="stat-card__icon" style={{ background: '#eff6ff', color: '#3b82f6', fontSize: '1.4rem' }}>👥</div>
                                    <div><span className="stat-card__value">{overview.totals.users}</span><span className="stat-card__label">Total Users</span></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card__icon" style={{ background: '#f0fdf4', color: '#22c55e', fontSize: '1.4rem' }}>🍵</div>
                                    <div><span className="stat-card__value">{overview.totals.products}</span><span className="stat-card__label">Products</span></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card__icon" style={{ background: '#fefce8', color: '#eab308', fontSize: '1.4rem' }}>📦</div>
                                    <div><span className="stat-card__value">{overview.totals.orders}</span><span className="stat-card__label">Orders</span></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card__icon" style={{ background: '#fdf4f3', color: '#8b6f47', fontSize: '1.4rem' }}>💰</div>
                                    <div><span className="stat-card__value">₹{(overview.totals.revenue || 0).toLocaleString()}</span><span className="stat-card__label">Revenue</span></div>
                                </div>
                            </div>

                            {/* Two-column insights row */}
                            <div className="admin__insights">
                                {/* Order Status Breakdown */}
                                {overview.statusBreakdown && Object.keys(overview.statusBreakdown).length > 0 && (
                                    <div className="admin__card">
                                        <div className="admin__card-title">Order Status Breakdown</div>
                                        <div className="admin__card-body">
                                            <div className="overview-status-grid">
                                                {Object.entries(overview.statusBreakdown).map(([status, count]) => (
                                                    <div key={status} className="overview-status-chip" style={{ background: statusColors[status] || '#888' }}>
                                                        {capitalize(status)}: {count as number}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Revenue Chart */}
                                {overview.monthlyRevenue?.length > 0 && (
                                    <div className="admin__card">
                                        <div className="admin__card-title">Monthly Revenue</div>
                                        <div className="admin__card-body">
                                            <div className="overview-chart">
                                                {(() => {
                                                    const maxR = Math.max(...overview.monthlyRevenue.map(m => m.revenue), 1);
                                                    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return overview.monthlyRevenue.map((m, i) => (
                                                        <div key={i} className="overview-chart__col">
                                                            <span className="overview-chart__value">₹{(m.revenue / 1000).toFixed(1)}k</span>
                                                            <div
                                                                className="overview-chart__bar"
                                                                style={{ height: `${Math.max((m.revenue / maxR) * 140, 4)}px` }}
                                                                title={`₹${m.revenue.toLocaleString()} (${m.orders} orders)`}
                                                            />
                                                            <span className="overview-chart__label">{months[m._id.month]}</span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recent Orders */}
                            {overview.recentOrders?.length > 0 && (
                                <div className="admin__card overview-card">
                                    <div className="admin__card-title">Recent Orders</div>
                                    <div className="admin__table-wrap">
                                        <table className="admin__table">
                                            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {overview.recentOrders.map(order => (
                                                    <tr key={order._id}>
                                                        <td>{order.orderNumber}</td>
                                                        <td>{order.user?.name || 'N/A'}</td>
                                                        <td>₹{order.total?.toLocaleString()}</td>
                                                        <td><span className="overview-status-chip overview-status-chip--sm" style={{ background: statusColors[order.status] || '#888' }}>{order.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Low-Stock Alerts */}
                            {lowStockProducts.length > 0 && (
                                <div className="admin__card overview-card overview-card--warning">
                                    <div className="admin__card-title overview-card-title--warning">⚠️ Low Stock Alert ({lowStockProducts.length} items)</div>
                                    <div className="admin__card-body">
                                        <div className="overview-lowstock">
                                            {lowStockProducts.slice(0, 8).map(p => (
                                                <div key={p._id} className={`overview-lowstock__row ${p.stock <= 3 ? 'overview-lowstock__row--critical' : ''}`}>
                                                    <span className="overview-lowstock__name">{p.name}</span>
                                                    <span className={`overview-lowstock__count ${p.stock <= 3 ? 'overview-lowstock__count--critical' : ''}`}>
                                                        {p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Export Buttons */}
                            <div className="admin__card overview-card">
                                <div className="admin__card-title">Export Data</div>
                                <div className="admin__card-body">
                                    <div className="overview-export">
                                        <button className="btn btn--ghost btn--sm" onClick={() => exportCSV('orders')} disabled={!!actionLoading}>{actionLoading === 'export-orders' ? '⏳ Exporting...' : '📥 Export Orders CSV'}</button>
                                        <button className="btn btn--ghost btn--sm" onClick={() => exportCSV('products')} disabled={!!actionLoading}>{actionLoading === 'export-products' ? '⏳ Exporting...' : '📥 Export Products CSV'}</button>
                                        <button className="btn btn--ghost btn--sm" onClick={() => exportCSV('users')} disabled={!!actionLoading}>{actionLoading === 'export-users' ? '⏳ Exporting...' : '📥 Export Users CSV'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS */}
                    {activeSection === 'products' && (
                        <div className="admin__section active" id="sectionProducts">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                <h3>{products.length} Products</h3>
                                <button className="btn btn--primary btn--sm" onClick={openCreateProduct}>+ Add Product</button>
                            </div>

                            {/* Product Form Modal */}
                            {showProductForm && (
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setShowProductForm(false); }}>
                                    <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                            <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                                            <button onClick={() => setShowProductForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                                        </div>
                                        <form onSubmit={handleProductSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div><label>Name *</label><input type="text" required value={productForm.name} onChange={e => handleProductFormChange('name', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Slug</label><input type="text" value={productForm.slug} onChange={e => handleProductFormChange('slug', e.target.value)} placeholder="auto-generated" style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div>
                                                <label>Type *</label>
                                                <select value={productForm.type} onChange={e => handleProductFormChange('type', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                                                    {['Black Tea', 'Green Tea', 'White Tea', 'Oolong', 'Herbal', 'Herbal Infusion', 'Masala Chai', 'Matcha'].map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div><label>Origin *</label><input type="text" required value={productForm.origin} onChange={e => handleProductFormChange('origin', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div style={{ gridColumn: '1 / -1' }}><label>Description *</label><textarea required value={productForm.description} onChange={e => handleProductFormChange('description', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', minHeight: 80 }} /></div>
                                            <div style={{ gridColumn: '1 / -1' }}><label>Short Description</label><input type="text" maxLength={200} value={productForm.shortDescription} onChange={e => handleProductFormChange('shortDescription', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>

                                            <h4 style={{ gridColumn: '1 / -1', margin: 'var(--space-sm) 0 0' }}>Pricing</h4>
                                            <div><label>50g (₹)</label><input type="number" min={0} value={productForm['price50g']} onChange={e => handleProductFormChange('price50g', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>100g (₹) *</label><input type="number" min={0} required value={productForm['price100g']} onChange={e => handleProductFormChange('price100g', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>200g (₹)</label><input type="number" min={0} value={productForm['price200g']} onChange={e => handleProductFormChange('price200g', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Stock</label><input type="number" min={0} value={productForm.stock} onChange={e => handleProductFormChange('stock', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>

                                            <div>
                                                <label>Caffeine</label>
                                                <select value={productForm.caffeine} onChange={e => handleProductFormChange('caffeine', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                                                    {['none', 'low', 'medium', 'high'].map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
                                                </select>
                                            </div>
                                            <div><label>Tasting Notes</label><input type="text" placeholder="floral, citrus, malty" value={productForm.tastingNotes} onChange={e => handleProductFormChange('tastingNotes', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Tags</label><input type="text" placeholder="premium, bestseller" value={productForm.tags} onChange={e => handleProductFormChange('tags', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Product Images</label>
                                                {/* Thumbnail previews */}
                                                {productForm.images.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
                                                        {productForm.images.map((url, i) => (
                                                            <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                                                <Image src={url} alt={`Product ${i + 1}`} width={72} height={72} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Drop zone + browse */}
                                                <div
                                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                                    onDragLeave={() => setDragOver(false)}
                                                    onDrop={handleDrop}
                                                    onClick={() => document.getElementById('productImageInput')?.click()}
                                                    style={{
                                                        border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                                        borderRadius: 'var(--radius-md)',
                                                        padding: 'var(--space-lg)',
                                                        textAlign: 'center',
                                                        cursor: 'pointer',
                                                        background: dragOver ? 'var(--color-accent-light, rgba(139,111,71,0.06))' : 'transparent',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    <input
                                                        id="productImageInput"
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                                        multiple
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => uploadImages(e.target.files)}
                                                    />
                                                    {uploading ? (
                                                        <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>⏳ Uploading...</span>
                                                    ) : (
                                                        <>
                                                            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📁</div>
                                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Drag &amp; drop images here, or <strong style={{ color: 'var(--color-accent)' }}>browse from PC</strong></span>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>JPEG, PNG, WebP, GIF, AVIF · Max 5 MB each</div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ marginBottom: 'var(--space-xs)', display: 'block' }}>Moods</label>
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    {['energize', 'relax', 'focus', 'detox', 'glow', 'immunity'].map(mood => (
                                                        <button type="button" key={mood} onClick={() => toggleMood(mood)} style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--color-border)', background: productForm.moods.includes(mood) ? 'var(--color-primary)' : 'transparent', color: productForm.moods.includes(mood) ? '#fff' : 'inherit', cursor: 'pointer', fontSize: '0.85rem' }}>{capitalize(mood)}</button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={productForm.inStock} onChange={e => handleProductFormChange('inStock', e.target.checked)} /> In Stock</label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={productForm.isBestSeller} onChange={e => handleProductFormChange('isBestSeller', e.target.checked)} /> Best Seller</label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={productForm.isNewArrival} onChange={e => handleProductFormChange('isNewArrival', e.target.checked)} /> New Arrival</label>
                                            </div>

                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                                <button type="submit" className="btn btn--primary">{editingProduct ? 'Update Product' : 'Create Product'}</button>
                                                <button type="button" className="btn btn--ghost" onClick={() => setShowProductForm(false)}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <table className="admin__table">
                                <thead><tr><th>Name</th><th>Type</th><th>Price (100g)</th><th>Stock</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p._id}>
                                            <td>{p.name}</td>
                                            <td>{p.type}</td>
                                            <td>₹{p.prices?.['100g'] || '-'}</td>
                                            <td>{p.stock}</td>
                                            <td style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn--ghost btn--sm" onClick={() => openEditProduct(p)}>Edit</button>
                                                <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteProduct(p._id, p.name)} disabled={actionLoading === `del-${p._id}`}>{actionLoading === `del-${p._id}` ? '⏳' : 'Delete'}</button>
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
                            {/* Search & Filter */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <h3>{orders.length} Orders</h3>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                                    <select
                                        value={orderStatusFilter}
                                        onChange={(e) => { setOrderStatusFilter(e.target.value); loadOrders(1, orderSearch, e.target.value); }}
                                        style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                                    >
                                        <option value="">All Statuses</option>
                                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                            <option key={s} value={s}>{capitalize(s)}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Search orders..."
                                        value={orderSearch}
                                        onChange={e => setOrderSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && loadOrders(1, orderSearch, orderStatusFilter)}
                                        style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', minWidth: 200 }}
                                    />
                                    <button className="btn btn--ghost btn--sm" onClick={() => loadOrders(1, orderSearch, orderStatusFilter)}>Search</button>
                                </div>
                            </div>
                            <table className="admin__table">
                                <thead><tr><th>Order #</th><th>Date & Time</th><th>Customer</th><th>Total</th><th>Status</th><th>Tracking</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td>{order.orderNumber}</td>
                                            <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}<br/>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}</td>
                                            <td>{order.user?.name || order.user?.email || 'N/A'}</td>
                                            <td>₹{order.total}</td>
                                            <td><span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', background: statusColors[order.status] || '#888', color: '#fff' }}>{order.status}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 140 }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Tracking #"
                                                        defaultValue={order.trackingNumber || ''}
                                                        onBlur={(e) => {
                                                            const val = e.target.value.trim();
                                                            if (val !== (order.trackingNumber || '')) {
                                                                updateTracking(order._id, val, order.trackingUrl || '');
                                                            }
                                                        }}
                                                        style={{ padding: '3px 6px', fontSize: '0.8rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', width: '100%' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Tracking URL"
                                                        defaultValue={order.trackingUrl || ''}
                                                        onBlur={(e) => {
                                                            const val = e.target.value.trim();
                                                            if (val !== (order.trackingUrl || '')) {
                                                                updateTracking(order._id, order.trackingNumber || '', val);
                                                            }
                                                        }}
                                                        style={{ padding: '3px 6px', fontSize: '0.8rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', width: '100%' }}
                                                    />
                                                </div>
                                            </td>
                                            <td style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} disabled={actionLoading === `status-${order._id}`} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                                                        <option key={s} value={s}>{capitalize(s)}</option>
                                                    ))}
                                                </select>
                                                <button className="btn btn--ghost btn--sm" title="Download Invoice" onClick={() => downloadInvoice(order._id)} disabled={actionLoading === `invoice-${order._id}`} style={{ fontSize: '0.85rem', padding: '4px 8px' }}>{actionLoading === `invoice-${order._id}` ? '⏳' : '🧾'}</button>
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

                    {/* USERS */}
                    {activeSection === 'users' && (
                        <div className="admin__section active" id="sectionUsers">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <h3>{userPagination.total || users.length} Users</h3>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && loadUsers(1, userSearch)}
                                        style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', minWidth: 200 }}
                                    />
                                    <button className="btn btn--ghost btn--sm" onClick={() => loadUsers(1, userSearch)}>Search</button>
                                </div>
                            </div>
                            <table className="admin__table">
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Orders</th><th>Spent</th><th>Joined</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id}>
                                            <td>{u.name}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                                            <td><span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', background: u.role === 'admin' ? '#8b6f47' : 'var(--color-bg-alt)', color: u.role === 'admin' ? '#fff' : 'inherit', fontWeight: 600 }}>{u.role}</span></td>
                                            <td>{u.orderCount}</td>
                                            <td>₹{(u.totalSpent || 0).toLocaleString()}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => changeUserRole(u._id, e.target.value)}
                                                    style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                                                >
                                                    <option value="customer">Customer</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {userPagination.totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 'var(--space-lg)' }}>
                                    {Array.from({ length: userPagination.totalPages }, (_, i) => (
                                        <button key={i} className={`btn btn--sm ${userPagination.page === i + 1 ? 'btn--primary' : 'btn--ghost'}`} onClick={() => loadUsers(i + 1, userSearch)}>{i + 1}</button>
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

                    {/* MESSAGES (Contact Submissions) */}
                    {activeSection === 'messages' && (
                        <div className="admin__section active">
                            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Contact Messages</h3>
                            {messagesLoading ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>Loading messages...</p>
                            ) : messages.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>No messages yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {messages.map((msg, i) => (
                                        <div key={msg._id || i} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                                <div>
                                                    <strong>{msg.name}</strong>
                                                    <span style={{ marginLeft: 12, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{msg.email}</span>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(msg.createdAt).toLocaleString('en-IN')}</span>
                                            </div>
                                            {msg.subject && <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>{msg.subject}</div>}
                                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{msg.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NEWSLETTER Subscribers */}
                    {activeSection === 'newsletter' && (
                        <div className="admin__section active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                <h3>{subscribers.length} Subscriber{subscribers.length !== 1 ? 's' : ''}</h3>
                            </div>
                            {subscribersLoading ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>Loading subscribers...</p>
                            ) : subscribers.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>No subscribers yet.</p>
                            ) : (
                                <table className="admin__table">
                                    <thead><tr><th>Email</th><th>Subscribed</th></tr></thead>
                                    <tbody>
                                        {subscribers.map((sub, i) => (
                                            <tr key={sub._id || i}>
                                                <td>{sub.email}</td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{new Date(sub.createdAt).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* COUPONS */}
                    {activeSection === 'coupons' && (
                        <div className="admin__section active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                <h3>{coupons.length} Coupon{coupons.length !== 1 ? 's' : ''}</h3>
                                <button className="btn btn--primary btn--sm" onClick={() => { setEditingCoupon(null); setCouponForm(emptyCoupon); setShowCouponForm(true); }}>+ Add Coupon</button>
                            </div>

                            {/* Coupon Form Modal */}
                            {showCouponForm && (
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setShowCouponForm(false); }}>
                                    <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                            <h2>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                                            <button onClick={() => setShowCouponForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                                        </div>
                                        <form onSubmit={handleCouponSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div style={{ gridColumn: '1 / -1' }}><label>Code *</label><input type="text" required value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. WELCOME20" style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase' }} /></div>
                                            <div>
                                                <label>Discount Type</label>
                                                <select value={couponForm.discountType} onChange={e => setCouponForm(f => ({ ...f, discountType: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="flat">Flat (₹)</option>
                                                </select>
                                            </div>
                                            <div><label>Discount Value *</label><input type="number" required min={1} value={couponForm.discountValue} onChange={e => setCouponForm(f => ({ ...f, discountValue: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Min Order (₹)</label><input type="number" min={0} value={couponForm.minOrderAmount} onChange={e => setCouponForm(f => ({ ...f, minOrderAmount: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Max Discount (₹)</label><input type="number" min={0} value={couponForm.maxDiscount} onChange={e => setCouponForm(f => ({ ...f, maxDiscount: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Usage Limit</label><input type="number" min={0} value={couponForm.usageLimit} onChange={e => setCouponForm(f => ({ ...f, usageLimit: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Per-User Limit</label><input type="number" min={0} value={couponForm.perUserLimit} onChange={e => setCouponForm(f => ({ ...f, perUserLimit: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Valid From</label><input type="date" value={couponForm.validFrom} onChange={e => setCouponForm(f => ({ ...f, validFrom: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Valid To</label><input type="date" value={couponForm.validTo} onChange={e => setCouponForm(f => ({ ...f, validTo: e.target.value }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={couponForm.active} onChange={e => setCouponForm(f => ({ ...f, active: e.target.checked }))} /> Active</label></div>
                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                                <button type="submit" className="btn btn--primary">{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</button>
                                                <button type="button" className="btn btn--ghost" onClick={() => setShowCouponForm(false)}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {couponsLoading ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>Loading coupons...</p>
                            ) : coupons.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>No coupons yet. Create one to offer discounts!</p>
                            ) : (
                                <table className="admin__table">
                                    <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Usage</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {coupons.map(c => (
                                            <tr key={c._id}>
                                                <td><strong>{c.code}</strong></td>
                                                <td>{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}{c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}</td>
                                                <td>{c.minOrderAmount ? `₹${c.minOrderAmount}` : '—'}</td>
                                                <td>{c.usedCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                                                <td style={{ fontSize: '0.85rem' }}>{c.validTo ? new Date(c.validTo).toLocaleDateString('en-IN') : '∞'}</td>
                                                <td><span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: c.active ? '#10b981' : '#6b7280', color: '#fff' }}>{c.active ? 'Active' : 'Inactive'}</span></td>
                                                <td style={{ display: 'flex', gap: 4 }}>
                                                    <button className="btn btn--ghost btn--sm" onClick={() => openEditCoupon(c)}>Edit</button>
                                                    <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteCoupon(c._id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* TESTIMONIALS / REVIEWS */}
                    {activeSection === 'testimonials' && (
                        <div className="admin__section active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                <h3>{testimonials.length} Review{testimonials.length !== 1 ? 's' : ''} · {testimonials.filter(t => t.approved).length} Approved</h3>
                                <button className="btn btn--primary btn--sm" onClick={() => { setEditingTestimonial(null); setTestimonialForm(emptyTestimonial); setShowTestimonialForm(true); }}>+ Add Review</button>
                            </div>

                            {/* Testimonial Form Modal */}
                            {showTestimonialForm && (
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setShowTestimonialForm(false); }}>
                                    <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                            <h2>{editingTestimonial ? 'Edit Review' : 'Add Review'}</h2>
                                            <button onClick={() => setShowTestimonialForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                                        </div>
                                        <form onSubmit={handleTestimonialSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div><label>Author Name *</label><input type="text" required value={testimonialForm.author} onChange={e => setTestimonialForm(f => ({ ...f, author: e.target.value }))} placeholder="e.g. Priya Sharma" style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div><label>Role / Location</label><input type="text" value={testimonialForm.role} onChange={e => setTestimonialForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Tea Enthusiast, Mumbai" style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div style={{ gridColumn: '1 / -1' }}><label>Review Text *</label><textarea required rows={4} value={testimonialForm.text} onChange={e => setTestimonialForm(f => ({ ...f, text: e.target.value }))} placeholder="Write the customer's review text..." style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }} /></div>
                                            <div>
                                                <label>Rating</label>
                                                <select value={testimonialForm.rating} onChange={e => setTestimonialForm(f => ({ ...f, rating: Number(e.target.value) }))} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                                                    <option value={5}>★★★★★ (5)</option>
                                                    <option value={4}>★★★★☆ (4)</option>
                                                    <option value={3}>★★★☆☆ (3)</option>
                                                    <option value={2}>★★☆☆☆ (2)</option>
                                                    <option value={1}>★☆☆☆☆ (1)</option>
                                                </select>
                                            </div>
                                            <div><label>Display Order</label><input type="number" min={0} value={testimonialForm.order} onChange={e => setTestimonialForm(f => ({ ...f, order: Number(e.target.value) || 0 }))} placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} /></div>
                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-lg)' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={testimonialForm.approved} onChange={e => setTestimonialForm(f => ({ ...f, approved: e.target.checked }))} /> Approved (visible on homepage)</label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={testimonialForm.featured} onChange={e => setTestimonialForm(f => ({ ...f, featured: e.target.checked }))} /> Featured (shown first)</label>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                                <button type="submit" className="btn btn--primary">{editingTestimonial ? 'Update Review' : 'Add Review'}</button>
                                                <button type="button" className="btn btn--ghost" onClick={() => setShowTestimonialForm(false)}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {testimonialsLoading ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>Loading reviews...</p>
                            ) : testimonials.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet. Add customer reviews to display on the homepage!</p>
                            ) : (
                                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                                    {testimonials.map(t => (
                                        <div key={t._id} style={{ padding: 'var(--space-lg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: t.approved ? 'var(--color-bg)' : 'var(--color-bg-alt, var(--color-bg))', opacity: t.approved ? 1 : 0.7, position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                                                <div>
                                                    <strong style={{ fontSize: '1.05rem' }}>{t.author}</strong>
                                                    <span style={{ marginLeft: 10, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{t.role}</span>
                                                    {t.featured && <span style={{ marginLeft: 8, padding: '1px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, background: '#f59e0b', color: '#fff' }}>Featured</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: t.approved ? '#10b981' : '#ef4444', color: '#fff' }}>{t.approved ? 'Approved' : 'Pending'}</span>
                                                </div>
                                            </div>
                                            <div style={{ color: '#f59e0b', marginBottom: 'var(--space-xs)', fontSize: '0.95rem' }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 'var(--space-md)', fontStyle: 'italic' }}>"{t.text}"</p>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <button className="btn btn--ghost btn--sm" style={{ color: t.approved ? 'var(--color-error)' : '#10b981', fontWeight: 600 }} onClick={() => toggleTestimonialApproval(t)}>{t.approved ? '✕ Reject' : '✓ Approve'}</button>
                                                <button className="btn btn--ghost btn--sm" style={{ color: t.featured ? 'var(--color-text-muted)' : '#f59e0b' }} onClick={() => toggleTestimonialFeatured(t)}>{t.featured ? 'Unfeature' : '★ Feature'}</button>
                                                <button className="btn btn--ghost btn--sm" onClick={() => openEditTestimonial(t)}>Edit</button>
                                                <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteTestimonial(t._id)}>Delete</button>
                                                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Order: {t.order} · {new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
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
    );
}

