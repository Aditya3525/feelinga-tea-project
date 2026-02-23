// ===== feelinga — ADMIN DASHBOARD =====

const API = 'http://localhost:5000/api/v1';
let token = localStorage.getItem('feelinga_token');
let currentUser = null;

// ===== AUTH GATE =====
const gate = document.getElementById('adminGate');
const dashboard = document.getElementById('adminDashboard');
const gateError = document.getElementById('gateError');

async function checkAuth() {
    if (!token) return showGate();
    try {
        const res = await fetch(`${API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
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
}

// Login form
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    gateError.style.display = 'none';
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('adminEmail').value,
                password: document.getElementById('adminPassword').value,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
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
        // Close sidebar on mobile
        document.getElementById('adminSidebar').classList.remove('open');
    });
});

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
});

// ===== OVERVIEW =====
async function loadOverview() {
    try {
        // Fetch product count
        const prodRes = await fetch(`${API}/products?limit=1`);
        const prodData = await prodRes.json();
        document.getElementById('statProducts').textContent = prodData.pagination.total;

        // Fetch orders
        const orderRes = await fetch(`${API}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const orderData = await orderRes.json();
        if (orderData.status === 'success') {
            document.getElementById('statOrders').textContent = orderData.pagination?.total || 0;
            // Calculate revenue
            const revenue = (orderData.data || []).reduce((sum, o) => sum + (o.total || 0), 0);
            document.getElementById('statRevenue').textContent = `₹${revenue.toLocaleString('en-IN')}`;
            // Render recent orders
            renderRecentOrders(orderData.data || []);
        } else {
            document.getElementById('statOrders').textContent = '0';
            document.getElementById('statRevenue').textContent = '₹0';
        }

        // Users — count from visible data
        document.getElementById('statUsers').textContent = '—';
    } catch (err) {
        console.error('Overview load error:', err);
    }
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recentOrdersTable');
    if (orders.length === 0) {
        container.innerHTML = '<p class="admin__empty">No orders yet</p>';
        return;
    }
    const rows = orders.slice(0, 5).map(o => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td>${o.user?.name || 'Guest'}</td>
      <td>${o.items?.length || 0} items</td>
      <td>₹${o.total?.toLocaleString('en-IN')}</td>
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

// ===== PRODUCTS =====
let allProducts = [];

async function loadProducts() {
    try {
        const res = await fetch(`${API}/products?limit=50`);
        const data = await res.json();
        allProducts = data.data || [];
        renderProducts();
    } catch (err) {
        console.error('Products load error:', err);
    }
}

function renderProducts() {
    const tbody = document.getElementById('productsBody');
    if (allProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin__empty">No products</td></tr>';
        return;
    }
    tbody.innerHTML = allProducts.map(p => `
    <tr>
      <td>
        <span class="product-name">${p.name}</span><br>
        <span class="product-slug">${p.slug}</span>
      </td>
      <td>${p.type}</td>
      <td>₹${p.prices?.['100g'] || '—'}</td>
      <td>${p.stock ?? '—'}</td>
      <td>⭐ ${p.rating?.toFixed(1) || '—'} (${p.reviewCount || 0})</td>
      <td>
        <div class="admin__actions">
          <button class="admin__action-btn" onclick="editProduct('${p._id}')">Edit</button>
          <button class="admin__action-btn admin__action-btn--danger" onclick="deleteProduct('${p._id}', '${p.name}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Product Modal
const productModal = document.getElementById('productModal');
let editingProductId = null;

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
    const p = allProducts.find(x => x._id === id);
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
        const res = await fetch(`${API}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Delete failed');
        allProducts = allProducts.filter(p => p._id !== id);
        renderProducts();
        document.getElementById('statProducts').textContent = allProducts.length;
    } catch (err) {
        alert(err.message);
    }
};

// Product form submit
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
        const url = editingProductId ? `${API}/products/${editingProductId}` : `${API}/products`;
        const method = editingProductId ? 'PATCH' : 'POST';
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        closeProductModal();
        await loadProducts();
        document.getElementById('statProducts').textContent = allProducts.length;
    } catch (err) {
        alert(err.message);
    }
});

// ===== ORDERS =====
let allOrders = [];

async function loadOrders() {
    try {
        const res = await fetch(`${API}/orders?limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        allOrders = data.data || [];
        renderOrders();
    } catch (err) {
        console.error('Orders load error:', err);
    }
}

function renderOrders() {
    const tbody = document.getElementById('ordersBody');
    const empty = document.getElementById('ordersEmpty');

    if (allOrders.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    tbody.innerHTML = allOrders.map(o => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td>${o.user?.name || 'Customer'}</td>
      <td>${o.items?.length || 0} items</td>
      <td>₹${o.total?.toLocaleString('en-IN')}</td>
      <td><span class="status-badge status-badge--${o.status}">${o.status}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
      <td>
        <select class="status-select" onchange="updateOrderStatus('${o._id}', this.value)">
          ${statusOptions.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${capitalize(s)}</option>`).join('')}
        </select>
      </td>
    </tr>
  `).join('');
}

window.updateOrderStatus = async function (id, status) {
    try {
        const res = await fetch(`${API}/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Update failed');
        await loadOrders();
        await loadOverview();
    } catch (err) {
        alert(err.message);
    }
};

// ===== INIT =====
checkAuth();
