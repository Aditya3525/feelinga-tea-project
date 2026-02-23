// ===== feelinga — USER PROFILE =====

const API = 'http://localhost:5000/api/v1';

// State
let currentUser = null;
let token = localStorage.getItem('feelinga_token');

// DOM
const gate = document.getElementById('profileGate');
const content = document.getElementById('profileContent');

// ===== AUTH CHECK =====
async function checkAuth() {
    if (!token) return showGate();
    try {
        const res = await fetch(`${API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        currentUser = data.data.user;
        showProfile();
    } catch {
        showGate();
    }
}

function showGate() {
    gate.style.display = 'flex';
    content.style.display = 'none';
}

function showProfile() {
    gate.style.display = 'none';
    content.style.display = 'grid';
    populateProfile();
}

function populateProfile() {
    if (!currentUser) return;
    const initial = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('profileAvatar').textContent = initial;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileNameInput').value = currentUser.name;
    document.getElementById('profileEmailInput').value = currentUser.email;
    document.getElementById('profilePhoneInput').value = currentUser.phone || '';
    renderAddresses();
    loadOrders();
}

// ===== TAB NAVIGATION =====
const tabs = document.querySelectorAll('.profile__nav-item');
const tabPanels = document.querySelectorAll('.profile__tab');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tabPanels.forEach(p => {
            p.classList.toggle('active', p.id === `tab${capitalize(target)}`);
        });
    });
});

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== PROFILE UPDATE =====
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('profileMsg');
    msgEl.textContent = '';
    msgEl.className = 'profile__msg';

    const body = {
        name: document.getElementById('profileNameInput').value.trim(),
        email: document.getElementById('profileEmailInput').value.trim(),
        phone: document.getElementById('profilePhoneInput').value.trim(),
    };

    try {
        const res = await fetch(`${API}/auth/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        currentUser = data.data.user;
        localStorage.setItem('feelinga_user', JSON.stringify(currentUser));
        populateProfile();
        msgEl.textContent = 'Profile updated successfully!';
        msgEl.className = 'profile__msg success';
    } catch (err) {
        msgEl.textContent = err.message;
        msgEl.className = 'profile__msg error';
    }
});

// ===== CHANGE PASSWORD =====
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('passwordMsg');
    msgEl.textContent = '';
    msgEl.className = 'profile__msg';

    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmPassword').value;

    if (newPwd !== confirmPwd) {
        msgEl.textContent = 'Passwords do not match';
        msgEl.className = 'profile__msg error';
        return;
    }

    try {
        const res = await fetch(`${API}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: newPwd,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        msgEl.textContent = 'Password updated successfully!';
        msgEl.className = 'profile__msg success';
        document.getElementById('passwordForm').reset();
    } catch (err) {
        msgEl.textContent = err.message;
        msgEl.className = 'profile__msg error';
    }
});

// ===== ADDRESSES =====
const addressList = document.getElementById('addressList');
const addressFormWrap = document.getElementById('addressFormWrap');

document.getElementById('addAddressBtn').addEventListener('click', () => {
    addressFormWrap.style.display = 'block';
    document.getElementById('addressForm').reset();
});

document.getElementById('cancelAddress').addEventListener('click', () => {
    addressFormWrap.style.display = 'none';
});

document.getElementById('addressForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
        label: document.getElementById('addrLabel').value,
        fullName: document.getElementById('addrName').value.trim(),
        phone: document.getElementById('addrPhone').value.trim(),
        addressLine1: document.getElementById('addrLine1').value.trim(),
        addressLine2: document.getElementById('addrLine2').value.trim() || undefined,
        city: document.getElementById('addrCity').value.trim(),
        state: document.getElementById('addrState').value.trim(),
        pincode: document.getElementById('addrPincode').value.trim(),
        isDefault: document.getElementById('addrDefault').checked,
    };

    try {
        const res = await fetch(`${API}/auth/me/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        currentUser.addresses = data.data.addresses;
        renderAddresses();
        addressFormWrap.style.display = 'none';
    } catch (err) {
        alert(err.message);
    }
});

function renderAddresses() {
    const addresses = currentUser.addresses || [];
    if (addresses.length === 0) {
        addressList.innerHTML = '<p class="profile__empty">No saved addresses yet</p>';
        return;
    }

    addressList.innerHTML = addresses.map(a => `
    <div class="address-card ${a.isDefault ? 'default' : ''}">
      <span class="address-card__label">${a.label}</span>
      ${a.isDefault ? '<span class="address-card__default">✓ Default</span>' : ''}
      <div class="address-card__name">${a.fullName}</div>
      <div class="address-card__text">
        ${a.addressLine1}<br>
        ${a.addressLine2 ? a.addressLine2 + '<br>' : ''}
        ${a.city}, ${a.state} – ${a.pincode}<br>
        📞 ${a.phone}
      </div>
      <div class="address-card__actions">
        <button class="address-card__btn address-card__btn--delete" onclick="deleteAddress('${a._id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

window.deleteAddress = async function (id) {
    if (!confirm('Remove this address?')) return;
    try {
        const res = await fetch(`${API}/auth/me/addresses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        currentUser.addresses = data.data.addresses;
        renderAddresses();
    } catch (err) {
        alert(err.message);
    }
};

// ===== ORDERS =====
async function loadOrders() {
    try {
        const res = await fetch(`${API}/orders/my`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        const orders = data.data || [];
        const container = document.getElementById('orderHistory');

        if (orders.length === 0) {
            container.innerHTML = '<p class="profile__empty">No orders yet. <a href="shop.html" style="color:var(--color-accent);">Start shopping →</a></p>';
            return;
        }

        container.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-card__header">
          <span class="order-card__number">Order #${o.orderNumber}</span>
          <span class="order-card__date">${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div class="order-card__items">${o.items?.length || 0} item(s)</div>
        <div class="order-card__footer">
          <span class="order-card__total">₹${o.total?.toLocaleString('en-IN')}</span>
          <span class="status-badge status-badge--${o.status}">${o.status}</span>
        </div>
      </div>
    `).join('');
    } catch {
        document.getElementById('orderHistory').innerHTML = '<p class="profile__empty">Could not load orders</p>';
    }
}

// ===== LOGOUT =====
document.getElementById('profileLogout').addEventListener('click', () => {
    localStorage.removeItem('feelinga_token');
    localStorage.removeItem('feelinga_refresh');
    localStorage.removeItem('feelinga_user');
    window.location.href = 'index.html';
});

// ===== INIT =====
checkAuth();
