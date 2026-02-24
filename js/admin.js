// ===== feelinga - ADMIN DASHBOARD =====

const API = 'http://localhost:5000/api/v1';
let token = localStorage.getItem('feelinga_token');
let currentUser = null;

const state = {
    products: { items: [], page: 1, limit: 10, totalPages: 1, total: 0, q: '', type: '' },
    orders: { items: [], page: 1, limit: 10, totalPages: 1, total: 0, q: '', status: '' },
    activity: { items: [], page: 1, limit: 8, totalPages: 1, total: 0 },
    selectedProducts: new Set(),
    selectedOrders: new Set(),
};

// ===== AUTH GATE =====
const gate = document.getElementById('adminGate');
const dashboard = document.getElementById('adminDashboard');
const gateError = document.getElementById('gateError');
const toastContainer = document.getElementById('adminToastContainer');

async function apiRequest(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast--${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function checkAuth() {
    if (!token) return showGate();
    try {
        const data = await apiRequest('/auth/me');
        if (data.data.user.role !== 'admin') {
            localStorage.removeItem('feelinga_token');
            token = null;
            return showGate('Access denied. Admin credentials required.');
        }
        currentUser = data.data.user;
        showDashboard();
    } catch {
        showGate();
    }
}

function showGate(errorMsg) {
    gate.style.display = 'flex';
    dashboard.style.display = 'none';
    if (errorMsg) {
        gateError.textContent = errorMsg;
        gateError.style.display = 'block';
    }
}

function showDashboard() {
    gate.style.display = 'none';
    dashboard.style.display = 'flex';
    document.getElementById('adminUserName').textContent = currentUser.name;
    loadOverview();
    loadProducts();
    loadOrders();
    loadActivity();
}

// Login form
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    gateError.style.display = 'none';
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('adminEmail').value,
                password: document.getElementById('adminPassword').value,
            }),
        });

        if (data.data.user.role !== 'admin') throw new Error('Not an admin account');
        token = data.data.accessToken;
        localStorage.setItem('feelinga_token', token);
        localStorage.setItem('feelinga_user', JSON.stringify(data.data.user));
        currentUser = data.data.user;
        showDashboard();
    } catch (err) {
        gateError.textContent = err.message;
        gateError.style.display = 'block';
    }
});

// Logout
document.getElementById('adminLogout').addEventListener('click', () => {
    localStorage.removeItem('feelinga_token');
    localStorage.removeItem('feelinga_user');
    token = null;
    currentUser = null;
    showGate();
});

// ===== NAV =====
const navItems = document.querySelectorAll('.admin__nav-item[data-section]');
const sections = document.querySelectorAll('.admin__section');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.section;
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        sections.forEach(s => s.classList.toggle('active', s.id === `section${capitalize(section)}`));
        pageTitle.textContent = capitalize(section);
        document.getElementById('adminSidebar').classList.remove('open');
    });
});

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
});

// ===== OVERVIEW =====
async function loadOverview() {
    try {
        const data = await apiRequest('/admin/dashboard');
        const totals = data.data.totals;

        document.getElementById('statProducts').textContent = totals.products;
        document.getElementById('statOrders').textContent = totals.orders;
        document.getElementById('statRevenue').textContent = `Rs ${Number(totals.revenue || 0).toLocaleString('en-IN')}`;
        document.getElementById('statUsers').textContent = totals.users;

        renderStatusBreakdown(data.data.statusBreakdown || {}, totals.orders || 0);
        renderMonthlyRevenue(data.data.monthlyRevenue || []);
        renderRecentOrders(data.data.recentOrders || []);
    } catch (err) {
        console.error('Overview load error:', err);
    }
}

function renderStatusBreakdown(breakdown, totalOrders) {
    const el = document.getElementById('statusBreakdown');
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!el) return;

    if (totalOrders <= 0) {
        el.innerHTML = '<p class="admin__empty">No status data</p>';
        return;
    }

    el.innerHTML = `
      <div class="status-breakdown">
        ${statuses.map(status => {
            const count = breakdown[status] || 0;
            const pct = Math.round((count / totalOrders) * 100);
            return `
              <div class="status-breakdown__row">
                <span>${capitalize(status)}</span>
                <div class="status-breakdown__bar">
                  <div class="status-breakdown__fill" style="width:${pct}%"></div>
                </div>
                <span>${count}</span>
              </div>
            `;
        }).join('')}
      </div>
    `;
}

function renderMonthlyRevenue(monthlyRevenue) {
    const el = document.getElementById('monthlyRevenueTrend');
    if (!el) return;
    if (!monthlyRevenue.length) {
        el.innerHTML = '<p class="admin__empty">No revenue data</p>';
        return;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maxRevenue = Math.max(...monthlyRevenue.map(row => Number(row.revenue || 0)), 1);
    el.innerHTML = `
      <div class="revenue-chart">
        ${monthlyRevenue.map(row => {
            const revenue = Number(row.revenue || 0);
            const width = Math.max(4, Math.round((revenue / maxRevenue) * 100));
            return `
              <div class="revenue-chart__row">
                <span>${monthNames[(row._id?.month || 1) - 1]}</span>
                <div class="revenue-chart__bar">
                  <div class="revenue-chart__fill" style="width:${width}%"></div>
                </div>
                <span>Rs ${revenue.toLocaleString('en-IN')}</span>
              </div>
            `;
        }).join('')}
      </div>
    `;
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recentOrdersTable');
    if (orders.length === 0) {
        container.innerHTML = '<p class="admin__empty">No orders yet</p>';
        return;
    }
    const rows = orders.map(o => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td>${o.user?.name || 'Guest'}</td>
      <td>${o.items?.length || 0} items</td>
      <td>Rs ${o.total?.toLocaleString('en-IN')}</td>
      <td><span class="status-badge status-badge--${o.status}">${o.status}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
    </tr>
  `).join('');
    container.innerHTML = `
    <table class="admin__table">
      <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderActivityFeed(items) {
    const el = document.getElementById('activityFeed');
    if (!el) return;
    if (!items.length) {
        el.innerHTML = '<p class="admin__empty">No activity yet</p>';
        return;
    }

    el.innerHTML = `
      <div class="activity-feed">
        ${items.map(item => `
          <div class="activity-feed__item">
            <div class="activity-feed__summary">${escapeHtml(item.summary || item.action || 'Activity')}</div>
            <div class="activity-feed__meta">
              ${escapeHtml(item.actorName || 'Admin')} • ${new Date(item.createdAt).toLocaleString('en-IN')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
}

async function loadActivity() {
    try {
        const params = new URLSearchParams({
            page: String(state.activity.page),
            limit: String(state.activity.limit),
        });

        const data = await apiRequest(`/admin/activity?${params.toString()}`);
        state.activity.items = data.data || [];
        state.activity.totalPages = data.pagination?.totalPages || 1;
        state.activity.total = data.pagination?.total || 0;

        renderActivityFeed(state.activity.items);
        renderPagination('activityPagination', state.activity.page, state.activity.totalPages, (nextPage) => {
            state.activity.page = nextPage;
            loadActivity();
        });
    } catch (err) {
        console.error('Activity load error:', err);
    }
}

// ===== PRODUCTS =====
const productSearch = document.getElementById('productSearch');
const productTypeFilter = document.getElementById('productTypeFilter');
const selectAllProducts = document.getElementById('selectAllProducts');
const bulkProductStockInput = document.getElementById('bulkProductStock');
const applyBulkProductStockBtn = document.getElementById('applyBulkProductStock');
const deleteSelectedProductsBtn = document.getElementById('deleteSelectedProducts');
const exportProductsBtn = document.getElementById('exportProductsBtn');
let editingProductId = null;

async function loadProducts() {
    try {
        const params = new URLSearchParams({
            page: String(state.products.page),
            limit: String(state.products.limit),
        });
        if (state.products.q) params.set('q', state.products.q);
        if (state.products.type) params.set('type', state.products.type);

        const data = await apiRequest(`/products?${params.toString()}`);
        state.products.items = data.data || [];
        state.products.totalPages = data.pagination?.totalPages || 1;
        state.products.total = data.pagination?.total || 0;
        renderProducts();
        renderPagination('productsPagination', state.products.page, state.products.totalPages, (nextPage) => {
            state.products.page = nextPage;
            loadProducts();
        });
    } catch (err) {
        console.error('Products load error:', err);
    }
}

function renderProducts() {
    const tbody = document.getElementById('productsBody');
    if (state.products.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="admin__empty">No products found</td></tr>';
        if (selectAllProducts) selectAllProducts.checked = false;
        return;
    }
    tbody.innerHTML = state.products.items.map(p => `
    <tr>
      <td><input type="checkbox" class="product-select" data-id="${p._id}" ${state.selectedProducts.has(p._id) ? 'checked' : ''}></td>
      <td>
        <span class="product-name">${p.name}</span><br>
        <span class="product-slug">${p.slug}</span>
      </td>
      <td>${p.type}</td>
      <td>Rs ${p.prices?.['100g'] || '-'}</td>
      <td>${p.stock ?? '-'}</td>
      <td>${p.rating?.toFixed(1) || '-'} (${p.reviewCount || 0})</td>
      <td>
        <div class="admin__actions">
          <button class="admin__action-btn" onclick="editProduct('${p._id}')">Edit</button>
          <button class="admin__action-btn admin__action-btn--danger" onclick="deleteProduct('${p._id}', '${escapeHtml(p.name)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

    tbody.querySelectorAll('.product-select').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) state.selectedProducts.add(id);
            else state.selectedProducts.delete(id);
        });
    });

    if (selectAllProducts) {
        const currentIds = state.products.items.map(p => p._id);
        selectAllProducts.checked = currentIds.length > 0 && currentIds.every(id => state.selectedProducts.has(id));
    }
}

function renderPagination(containerId, page, totalPages, onClick) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (totalPages <= 1) {
        el.innerHTML = '';
        return;
    }

    el.innerHTML = `
      <button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Prev</button>
      <span>Page ${page} of ${totalPages}</span>
      <button ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">Next</button>
    `;

    el.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => onClick(Number(btn.dataset.page)));
    });
}

const productModal = document.getElementById('productModal');
document.getElementById('addProductBtn').addEventListener('click', () => {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    productModal.classList.add('active');
});

document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
document.getElementById('cancelProductModal').addEventListener('click', closeProductModal);
document.querySelector('#productModal .admin-modal__overlay').addEventListener('click', closeProductModal);

function closeProductModal() {
    productModal.classList.remove('active');
}

window.editProduct = function (id) {
    const p = state.products.items.find(x => x._id === id);
    if (!p) return;
    editingProductId = id;
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('pName').value = p.name;
    document.getElementById('pSlug').value = p.slug;
    document.getElementById('pType').value = p.type;
    document.getElementById('pOrigin').value = p.origin;
    document.getElementById('pPrice50').value = p.prices?.['50g'] || '';
    document.getElementById('pPrice100').value = p.prices?.['100g'] || '';
    document.getElementById('pPrice200').value = p.prices?.['200g'] || '';
    document.getElementById('pStock').value = p.stock ?? 100;
    document.getElementById('pDesc').value = p.description;
    productModal.classList.add('active');
};

window.deleteProduct = async function (id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
        await apiRequest(`/products/${id}`, { method: 'DELETE' });
        state.selectedProducts.delete(id);
        await loadProducts();
        await loadOverview();
        await loadActivity();
        showToast('Product deleted');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
        name: document.getElementById('pName').value,
        slug: document.getElementById('pSlug').value,
        type: document.getElementById('pType').value,
        origin: document.getElementById('pOrigin').value,
        description: document.getElementById('pDesc').value,
        prices: {
            '100g': Number(document.getElementById('pPrice100').value),
        },
        stock: Number(document.getElementById('pStock').value) || 100,
    };
    const p50 = document.getElementById('pPrice50').value;
    const p200 = document.getElementById('pPrice200').value;
    if (p50) body.prices['50g'] = Number(p50);
    if (p200) body.prices['200g'] = Number(p200);

    try {
        const url = editingProductId ? `/products/${editingProductId}` : '/products';
        const method = editingProductId ? 'PATCH' : 'POST';
        await apiRequest(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        closeProductModal();
        await loadProducts();
        await loadOverview();
        await loadActivity();
        showToast(editingProductId ? 'Product updated' : 'Product created');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// ===== ORDERS =====
const orderSearch = document.getElementById('orderSearch');
const orderStatusFilter = document.getElementById('orderStatusFilter');
const selectAllOrders = document.getElementById('selectAllOrders');
const bulkOrderStatus = document.getElementById('bulkOrderStatus');
const applyBulkOrderStatusBtn = document.getElementById('applyBulkOrderStatus');
const exportOrdersBtn = document.getElementById('exportOrdersBtn');
const orderModal = document.getElementById('orderModal');
const orderModalBody = document.getElementById('orderModalBody');

async function loadOrders() {
    try {
        const params = new URLSearchParams({
            page: String(state.orders.page),
            limit: String(state.orders.limit),
        });
        if (state.orders.q) params.set('q', state.orders.q);
        if (state.orders.status) params.set('status', state.orders.status);

        const data = await apiRequest(`/orders?${params.toString()}`);
        state.orders.items = data.data || [];
        state.orders.totalPages = data.pagination?.totalPages || 1;
        state.orders.total = data.pagination?.total || 0;
        renderOrders();
        renderPagination('ordersPagination', state.orders.page, state.orders.totalPages, (nextPage) => {
            state.orders.page = nextPage;
            loadOrders();
        });
    } catch (err) {
        console.error('Orders load error:', err);
    }
}

function renderOrders() {
    const tbody = document.getElementById('ordersBody');
    const empty = document.getElementById('ordersEmpty');

    if (state.orders.items.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        if (selectAllOrders) selectAllOrders.checked = false;
        return;
    }
    empty.style.display = 'none';

    const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    tbody.innerHTML = state.orders.items.map(o => `
    <tr>
      <td><input type="checkbox" class="order-select" data-id="${o._id}" ${state.selectedOrders.has(o._id) ? 'checked' : ''}></td>
      <td><strong>${o.orderNumber}</strong></td>
      <td>${o.user?.name || 'Customer'}</td>
      <td>${o.items?.length || 0} items</td>
      <td>Rs ${o.total?.toLocaleString('en-IN')}</td>
      <td><span class="status-badge status-badge--${o.status}">${o.status}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
      <td>
        <div class="admin__actions">
          <button class="admin__action-btn" onclick="viewOrder('${o._id}')">View</button>
          <select class="status-select" onchange="updateOrderStatus('${o._id}', this.value)">
            ${statusOptions.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${capitalize(s)}</option>`).join('')}
          </select>
        </div>
      </td>
    </tr>
  `).join('');

    tbody.querySelectorAll('.order-select').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) state.selectedOrders.add(id);
            else state.selectedOrders.delete(id);
        });
    });

    if (selectAllOrders) {
        const currentIds = state.orders.items.map(o => o._id);
        selectAllOrders.checked = currentIds.length > 0 && currentIds.every(id => state.selectedOrders.has(id));
    }
}

window.updateOrderStatus = async function (id, status) {
    try {
        await apiRequest(`/orders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        await loadOrders();
        await loadOverview();
        await loadActivity();
        showToast(`Order updated to ${status}`);
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.viewOrder = async function (id) {
    try {
        const data = await apiRequest(`/orders/${id}`);
        const o = data.data;
        const address = o.shippingAddress || {};

        orderModalBody.innerHTML = `
          <div class="order-detail">
            <div class="order-detail__block">
              <div class="order-detail__title">Order Summary</div>
              <div><strong>${o.orderNumber}</strong></div>
              <div>Status: <span class="status-badge status-badge--${o.status}">${o.status}</span></div>
              <div>Payment: ${o.paymentMethod} (${o.paymentStatus})</div>
              <div>Total: Rs ${o.total?.toLocaleString('en-IN')}</div>
            </div>
            <div class="order-detail__block">
              <div class="order-detail__title">Shipping Address</div>
              <div>${address.firstName || ''} ${address.lastName || ''}</div>
              <div>${address.line1 || ''}</div>
              <div>${address.line2 || ''}</div>
              <div>${address.city || ''}, ${address.state || ''} ${address.pincode || ''}</div>
              <div>${address.phone || ''}</div>
            </div>
            <div class="order-detail__block">
              <div class="order-detail__title">Items</div>
              <div class="order-detail__items">
                ${(o.items || []).map(item => `
                  <div class="order-detail__item">
                    <span>${item.name} (${item.size}) x ${item.qty}</span>
                    <strong>Rs ${(item.price * item.qty).toLocaleString('en-IN')}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;

        orderModal.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

document.getElementById('closeOrderModal').addEventListener('click', () => orderModal.classList.remove('active'));
document.querySelector('#orderModal .admin-modal__overlay').addEventListener('click', () => orderModal.classList.remove('active'));

// ===== CSV EXPORT =====
async function fetchAllPages(pathBuilder) {
    let page = 1;
    const all = [];
    let totalPages = 1;
    do {
        const data = await apiRequest(pathBuilder(page));
        all.push(...(data.data || []));
        totalPages = data.pagination?.totalPages || 1;
        page += 1;
    } while (page <= totalPages);
    return all;
}

function csvEscape(value) {
    const str = String(value ?? '');
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replaceAll('"', '""')}"`;
    }
    return str;
}

function downloadCSV(filename, headers, rows) {
    const content = [
        headers.map(csvEscape).join(','),
        ...rows.map(row => row.map(csvEscape).join(',')),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== FILTER CONTROLS =====
const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
};

productSearch.addEventListener('input', debounce((e) => {
    state.products.q = e.target.value.trim();
    state.products.page = 1;
    loadProducts();
}, 300));

productTypeFilter.addEventListener('change', (e) => {
    state.products.type = e.target.value;
    state.products.page = 1;
    loadProducts();
});

orderSearch.addEventListener('input', debounce((e) => {
    state.orders.q = e.target.value.trim();
    state.orders.page = 1;
    loadOrders();
}, 300));

orderStatusFilter.addEventListener('change', (e) => {
    state.orders.status = e.target.value;
    state.orders.page = 1;
    loadOrders();
});

if (selectAllProducts) {
    selectAllProducts.addEventListener('change', (e) => {
        const checked = e.target.checked;
        state.products.items.forEach(p => {
            if (checked) state.selectedProducts.add(p._id);
            else state.selectedProducts.delete(p._id);
        });
        renderProducts();
    });
}

if (selectAllOrders) {
    selectAllOrders.addEventListener('change', (e) => {
        const checked = e.target.checked;
        state.orders.items.forEach(o => {
            if (checked) state.selectedOrders.add(o._id);
            else state.selectedOrders.delete(o._id);
        });
        renderOrders();
    });
}

if (applyBulkOrderStatusBtn) {
    applyBulkOrderStatusBtn.addEventListener('click', async () => {
        const status = bulkOrderStatus.value;
        const orderIds = Array.from(state.selectedOrders);
        if (!status) return showToast('Select a status for bulk update.', 'error');
        if (orderIds.length === 0) return showToast('Select at least one order.', 'error');

        try {
            await apiRequest('/orders/bulk-status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds, status }),
            });

            state.selectedOrders.clear();
            bulkOrderStatus.value = '';
            await loadOrders();
            await loadOverview();
            await loadActivity();
            showToast(`Updated ${orderIds.length} orders to ${status}`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

if (applyBulkProductStockBtn) {
    applyBulkProductStockBtn.addEventListener('click', async () => {
        const stock = Number.parseInt(bulkProductStockInput?.value || '', 10);
        const productIds = Array.from(state.selectedProducts);
        if (!Number.isInteger(stock) || stock < 0) return showToast('Enter a valid stock value.', 'error');
        if (productIds.length === 0) return showToast('Select at least one product.', 'error');

        try {
            await apiRequest('/products/bulk-stock', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds, stock }),
            });

            state.selectedProducts.clear();
            if (bulkProductStockInput) bulkProductStockInput.value = '';
            await loadProducts();
            await loadOverview();
            await loadActivity();
            showToast(`Updated stock for ${productIds.length} products`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

if (deleteSelectedProductsBtn) {
    deleteSelectedProductsBtn.addEventListener('click', async () => {
        const productIds = Array.from(state.selectedProducts);
        if (productIds.length === 0) return showToast('Select at least one product.', 'error');
        if (!confirm(`Delete ${productIds.length} selected products? This cannot be undone.`)) return;

        try {
            await apiRequest('/products/bulk', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds }),
            });
            state.selectedProducts.clear();
            await loadProducts();
            await loadOverview();
            await loadActivity();
            showToast(`Deleted ${productIds.length} products`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

if (exportProductsBtn) {
    exportProductsBtn.addEventListener('click', async () => {
        try {
            const rows = await fetchAllPages((page) => {
                const params = new URLSearchParams({ page: String(page), limit: '50' });
                if (state.products.q) params.set('q', state.products.q);
                if (state.products.type) params.set('type', state.products.type);
                return `/products?${params.toString()}`;
            });

            downloadCSV(
                `products_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Name', 'Slug', 'Type', 'Origin', 'Price100g', 'Stock', 'Rating', 'ReviewCount'],
                rows.map(p => [
                    p.name, p.slug, p.type, p.origin,
                    p.prices?.['100g'] ?? '',
                    p.stock ?? '',
                    p.rating ?? '',
                    p.reviewCount ?? '',
                ]),
            );
            showToast('Products CSV exported');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

if (exportOrdersBtn) {
    exportOrdersBtn.addEventListener('click', async () => {
        try {
            const rows = await fetchAllPages((page) => {
                const params = new URLSearchParams({ page: String(page), limit: '50' });
                if (state.orders.q) params.set('q', state.orders.q);
                if (state.orders.status) params.set('status', state.orders.status);
                return `/orders?${params.toString()}`;
            });

            downloadCSV(
                `orders_${new Date().toISOString().slice(0, 10)}.csv`,
                ['OrderNumber', 'Customer', 'Email', 'Items', 'Total', 'Status', 'CreatedAt'],
                rows.map(o => [
                    o.orderNumber,
                    o.user?.name || '',
                    o.user?.email || '',
                    o.items?.length || 0,
                    o.total || 0,
                    o.status || '',
                    new Date(o.createdAt).toISOString(),
                ]),
            );
            showToast('Orders CSV exported');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// ===== INIT =====
checkAuth();
