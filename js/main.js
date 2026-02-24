// ===== feelinga — MAIN JS =====

document.addEventListener('DOMContentLoaded', () => {

  // ===== PAGE ENTRANCE ANIMATION =====
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  requestAnimationFrame(() => { document.body.style.opacity = '1'; });

  // ===== DARK MODE TOGGLE =====
  const savedTheme = localStorage.getItem('serene_theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Inject toggle button into header
  const headerActions = document.querySelector('.header__actions');
  if (headerActions) {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle';
    themeBtn.setAttribute('aria-label', 'Toggle dark mode');
    themeBtn.innerHTML = `
      <svg class="theme-toggle__moon" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
      </svg>
      <svg class="theme-toggle__sun" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    `;
    // Insert before the first child (search button)
    headerActions.insertBefore(themeBtn, headerActions.firstChild);

    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('serene_theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('serene_theme', 'dark');
      }
    });
  }

  // ===== AUTH MODAL =====
  const API_BASE = 'http://localhost:5000/api/v1';

  // Create auth modal
  const authModal = document.createElement('div');
  authModal.className = 'auth-modal';
  authModal.innerHTML = `
    <div class="auth-modal__overlay"></div>
    <div class="auth-modal__dialog">
      <button class="auth-modal__close" aria-label="Close">&times;</button>
      <div class="auth-modal__header">
        <h2 class="auth-modal__title">Welcome Back</h2>
        <p class="auth-modal__subtitle">Sign in to your feelinga account</p>
      </div>
      <div class="auth-modal__tabs">
        <button class="auth-modal__tab active" data-tab="login">Login</button>
        <button class="auth-modal__tab" data-tab="signup">Sign Up</button>
      </div>
      <div class="auth-modal__error" id="authError"></div>
      <form class="auth-modal__form" id="loginForm">
        <div class="auth-modal__field">
          <label for="loginEmail">Email</label>
          <input type="email" id="loginEmail" placeholder="your@email.com" required>
        </div>
        <div class="auth-modal__field">
          <label for="loginPassword">Password</label>
          <input type="password" id="loginPassword" placeholder="Min 8 characters" required minlength="8">
        </div>
        <button type="submit" class="btn btn--primary auth-modal__submit">
          <span>Sign In</span>
          <span class="auth-modal__spinner" style="display:none;">⏳</span>
        </button>
      </form>
      <form class="auth-modal__form" id="signupForm" style="display:none;">
        <div class="auth-modal__field">
          <label for="signupName">Full Name</label>
          <input type="text" id="signupName" placeholder="Your name" required minlength="2">
        </div>
        <div class="auth-modal__field">
          <label for="signupEmail">Email</label>
          <input type="email" id="signupEmail" placeholder="your@email.com" required>
        </div>
        <div class="auth-modal__field">
          <label for="signupPassword">Password</label>
          <input type="password" id="signupPassword" placeholder="Min 8 characters" required minlength="8">
        </div>
        <button type="submit" class="btn btn--primary auth-modal__submit">
          <span>Create Account</span>
          <span class="auth-modal__spinner" style="display:none;">⏳</span>
        </button>
      </form>
      <div class="auth-modal__divider">
        <span>OR</span>
      </div>
      <button class="auth-modal__google" id="googleSignInBtn">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>
      <div class="auth-modal__footer">
        <span id="authToggleText">Don't have an account?</span>
        <button class="auth-modal__toggle" id="authToggleBtn">Sign Up</button>
      </div>
    </div>
  `;
  document.body.appendChild(authModal);

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authError = document.getElementById('authError');
  const authTabs = authModal.querySelectorAll('.auth-modal__tab');
  const authTitle = authModal.querySelector('.auth-modal__title');
  const authSubtitle = authModal.querySelector('.auth-modal__subtitle');

  function switchAuthTab(tab) {
    authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    authError.textContent = '';
    authError.style.display = 'none';
    if (tab === 'login') {
      loginForm.style.display = 'flex';
      signupForm.style.display = 'none';
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Sign in to your feelinga account';
      document.getElementById('authToggleText').textContent = "Don't have an account?";
      document.getElementById('authToggleBtn').textContent = 'Sign Up';
    } else {
      loginForm.style.display = 'none';
      signupForm.style.display = 'flex';
      authTitle.textContent = 'Create Account';
      authSubtitle.textContent = 'Join the feelinga community';
      document.getElementById('authToggleText').textContent = "Already have an account?";
      document.getElementById('authToggleBtn').textContent = 'Sign In';
    }
  }

  authTabs.forEach(t => t.addEventListener('click', () => switchAuthTab(t.dataset.tab)));
  document.getElementById('authToggleBtn').addEventListener('click', () => {
    const current = authModal.querySelector('.auth-modal__tab.active').dataset.tab;
    switchAuthTab(current === 'login' ? 'signup' : 'login');
  });

  function showAuthError(msg) {
    authError.textContent = msg;
    authError.style.display = 'block';
  }

  function openAuthModal() {
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  authModal.querySelector('.auth-modal__overlay').addEventListener('click', closeAuthModal);
  authModal.querySelector('.auth-modal__close').addEventListener('click', closeAuthModal);

  function setSubmitting(form, loading) {
    const btn = form.querySelector('.auth-modal__submit');
    const label = btn.querySelector('span:first-child');
    const spinner = btn.querySelector('.auth-modal__spinner');
    btn.disabled = loading;
    label.style.display = loading ? 'none' : '';
    spinner.style.display = loading ? 'inline' : 'none';
  }

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.style.display = 'none';
    setSubmitting(loginForm, true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      saveAuthData(data.data);
      closeAuthModal();
      showToast(`Welcome back, ${data.data.user.name}!`, 'success');
      updateHeaderAuth();
    } catch (err) {
      showAuthError(err.message);
    } finally {
      setSubmitting(loginForm, false);
    }
  });

  // Signup handler
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.style.display = 'none';
    setSubmitting(signupForm, true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('signupName').value,
          email: document.getElementById('signupEmail').value,
          password: document.getElementById('signupPassword').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      saveAuthData(data.data);
      closeAuthModal();
      showToast(`Welcome to feelinga, ${data.data.user.name}!`, 'success');
      updateHeaderAuth();
    } catch (err) {
      showAuthError(err.message);
    } finally {
      setSubmitting(signupForm, false);
    }
  });

  // ===== GOOGLE SIGN-IN =====
  const GOOGLE_CLIENT_ID = '791719035831-gcigfr4rratukp5en03gfk6j73mutdvi.apps.googleusercontent.com';

  // Load Google Identity Services
  const gsiScript = document.createElement('script');
  gsiScript.src = 'https://accounts.google.com/gsi/client';
  gsiScript.async = true;
  gsiScript.defer = true;
  document.head.appendChild(gsiScript);

  gsiScript.onload = () => {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
    }
  };

  document.getElementById('googleSignInBtn').addEventListener('click', () => {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: use popup mode
          google.accounts.id.renderButton(
            document.getElementById('googleSignInBtn'),
            { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
          );
          // Trigger click on rendered button
          const gBtn = document.querySelector('#googleSignInBtn iframe, #googleSignInBtn div[role="button"]');
          if (gBtn) gBtn.click();
        }
      });
    } else {
      showAuthError('Google Sign-In is loading. Please try again.');
    }
  });

  async function handleGoogleCredential(response) {
    authError.style.display = 'none';
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google login failed');
      saveAuthData(data.data);
      closeAuthModal();
      showToast(`Welcome, ${data.data.user.name}!`, 'success');
      updateHeaderAuth();
    } catch (err) {
      showAuthError(err.message);
    }
  }

  // Make callback globally accessible for Google One Tap
  window.handleGoogleCredential = handleGoogleCredential;

  // Auth data management
  function saveAuthData(data) {
    localStorage.setItem('feelinga_token', data.accessToken);
    localStorage.setItem('feelinga_refresh', data.refreshToken);
    localStorage.setItem('feelinga_user', JSON.stringify(data.user));
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem('feelinga_user')); } catch { return null; }
  }

  function logout() {
    const token = localStorage.getItem('feelinga_token');
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => { });
    }
    localStorage.removeItem('feelinga_token');
    localStorage.removeItem('feelinga_refresh');
    localStorage.removeItem('feelinga_user');
    updateHeaderAuth();
    showToast('Signed out successfully', 'info');
  }

  // Update header account button
  function updateHeaderAuth() {
    const user = getUser();
    const accountLink = document.querySelector('.header__actions a[aria-label="Account"]');
    if (!accountLink) return;

    if (user) {
      const initial = user.name.charAt(0).toUpperCase();
      accountLink.innerHTML = `<span class="header__avatar">${initial}</span>`;
      accountLink.href = 'profile.html';
      accountLink.setAttribute('aria-label', `${user.name} — My Account`);
      accountLink.title = `Signed in as ${user.name}\nClick to view profile`;
      accountLink.onclick = null;
    } else {
      accountLink.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      accountLink.href = '#';
      accountLink.setAttribute('aria-label', 'Account');
      accountLink.title = 'Sign in / Create account';
      accountLink.onclick = (e) => { e.preventDefault(); openAuthModal(); };
    }
  }

  // Init header auth state
  updateHeaderAuth();
  window.openAuthModal = openAuthModal;
  window.logout = logout;

  // ===== TOAST NOTIFICATIONS =====
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  function showToast(message, type = 'success', imgSrc = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons = { success: '✓', info: 'ℹ', error: '✕' };
    toast.innerHTML = `
      ${imgSrc ? `<img src="${imgSrc}" alt="" class="toast__img">` : ''}
      <div class="toast__content">
        <div class="toast__icon toast__icon--${type}">${icons[type] || '✓'}</div>
        <span class="toast__message">${message}</span>
      </div>
      <button class="toast__close" aria-label="Dismiss">✕</button>
    `;
    toastContainer.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('active'));
    // Auto-dismiss
    const timer = setTimeout(() => dismissToast(toast), 3500);
    toast.querySelector('.toast__close').addEventListener('click', () => {
      clearTimeout(timer);
      dismissToast(toast);
    });
  }

  function dismissToast(toast) {
    toast.classList.remove('active');
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  }

  window.showToast = showToast;

  // ===== MOBILE MENU =====
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', mobileNav.classList.contains('active'));
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ===== CART DRAWER =====
  const cartBtn = document.getElementById('cartBtn');
  const cartClose = document.getElementById('cartClose');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');

  // Load cart from localStorage
  let cart = JSON.parse(localStorage.getItem('serene_cart') || '[]');

  function saveCart() {
    localStorage.setItem('serene_cart', JSON.stringify(cart));
  }

  // Update cart badge on page load
  if (cartCount) {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function openCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add('active');
      cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('active');
      cartOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function updateCartUI() {
    if (!cartCount || !cartItems || !cartTotal) return;
    cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="cart-empty"><div class="icon">🍃</div><p>Your cart is empty</p><a href="shop.html" class="btn btn--ghost" style="justify-content:center">Start Shopping</a></div>';
      cartTotal.textContent = '₹0';
      return;
    }

    const itemImgMap = {
      'Classic Assam Breakfast': 'images/darjeeling-tea.png',
      'Himalayan Green Reserve': 'images/green-tea.png',
      'Heritage Spiced Chai': 'images/masala-chai.png',
      'Moonlight White Peony': 'images/white-tea.png',
      'Turmeric Golden Glow': 'images/herbal-tea.png',
      'Rose Chamomile Dream': 'images/herbal-tea.png',
      'Darjeeling Muscatel Oolong': 'images/oolong-tea.png',
      'Spring Flush Sencha': 'images/green-tea.png',
      'First Flush Darjeeling': 'images/darjeeling-tea.png',
      'Peppermint Detox': 'images/green-tea.png',
      'Ceremonial Matcha': 'images/matcha-tea.png',
      'Silver Needle White': 'images/white-tea.png',
    };

    cartItems.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <img src="${itemImgMap[item.name] || 'images/darjeeling-tea.png'}" alt="${item.name}" class="cart-item__img" style="width:48px;height:48px;border-radius:6px;object-fit:cover">
        <div class="cart-item__details">
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__price">₹${item.price} × ${item.qty}</div>
          <div class="cart-item__remove" data-index="${i}">Remove</div>
        </div>
      </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartTotal.textContent = '₹' + total.toLocaleString('en-IN');

    cartItems.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        cart.splice(parseInt(e.target.dataset.index), 1);
        saveCart();
        updateCartUI();
      });
    });
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Checkout button
  document.querySelectorAll('.cart-drawer__footer .btn--primary').forEach(btn => {
    btn.addEventListener('click', () => {
      if (cart.length > 0) window.location.href = 'checkout.html';
    });
  });

  // Global addToCart
  window.addToCart = function (name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) { existing.qty++; }
    else { cart.push({ name, price, qty: 1 }); }
    saveCart();
    updateCartUI();
    // Show toast instead of opening cart
    const product = searchProducts?.find(p => p.name === name);
    showToast(`${name} added to cart`, 'success', product?.img || null);
  };

  // ===== SEARCH OVERLAY =====
  const searchProducts = [
    { name: 'Classic Assam Breakfast', type: 'Black Tea', price: 499, url: 'product.html', img: 'images/darjeeling-tea.png' },
    { name: 'Himalayan Green Reserve', type: 'Green Tea', price: 599, url: 'product.html', img: 'images/green-tea.png' },
    { name: 'Heritage Spiced Chai', type: 'Masala Chai', price: 399, url: 'product.html', img: 'images/masala-chai.png' },
    { name: 'Moonlight White Peony', type: 'White Tea', price: 899, url: 'product.html', img: 'images/white-tea.png' },
    { name: 'Turmeric Golden Glow', type: 'Herbal', price: 549, url: 'product.html', img: 'images/herbal-tea.png' },
    { name: 'Rose Chamomile Dream', type: 'Herbal Infusion', price: 649, url: 'product.html', img: 'images/herbal-tea.png' },
    { name: 'Darjeeling Muscatel Oolong', type: 'Oolong', price: 1199, url: 'product.html', img: 'images/oolong-tea.png' },
    { name: 'Spring Flush Sencha', type: 'Green Tea', price: 749, url: 'product.html', img: 'images/green-tea.png' },
    { name: 'First Flush Darjeeling', type: 'Black Tea', price: 1299, url: 'product.html', img: 'images/darjeeling-tea.png' },
    { name: 'Peppermint Detox', type: 'Herbal', price: 479, url: 'product.html', img: 'images/green-tea.png' },
    { name: 'Ceremonial Matcha', type: 'Green Tea', price: 1190, url: 'product.html', img: 'images/matcha-tea.png' },
    { name: 'Silver Needle White', type: 'White Tea', price: 1899, url: 'product.html', img: 'images/white-tea.png' },
  ];

  // Create search overlay element
  const searchOverlay = document.createElement('div');
  searchOverlay.className = 'search-overlay';
  searchOverlay.innerHTML = `
    <div class="search-overlay__inner">
      <div class="search-overlay__header">
        <div class="search-overlay__input-wrap">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" id="searchInput" placeholder="Search teas, blends, moods..." autocomplete="off">
        </div>
        <button class="search-overlay__close" id="searchClose" aria-label="Close search">✕</button>
      </div>
      <div class="search-overlay__results" id="searchResults">
        <div class="search-overlay__hint">Start typing to search our collection…</div>
      </div>
      <div class="search-overlay__quick">
        <span class="search-overlay__label">Popular:</span>
        <button class="search-tag" data-q="green">Green Tea</button>
        <button class="search-tag" data-q="darjeeling">Darjeeling</button>
        <button class="search-tag" data-q="herbal">Herbal</button>
        <button class="search-tag" data-q="chai">Chai</button>
        <button class="search-tag" data-q="white">White Tea</button>
      </div>
    </div>
  `;
  document.body.appendChild(searchOverlay);

  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchCloseBtn = document.getElementById('searchClose');

  function openSearch() {
    searchOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput.focus(), 100);
  }

  function closeSearch() {
    searchOverlay.classList.remove('active');
    document.body.style.overflow = '';
    searchInput.value = '';
    searchResults.innerHTML = '<div class="search-overlay__hint">Start typing to search our collection…</div>';
  }

  function performSearch(query) {
    if (!query.trim()) {
      searchResults.innerHTML = '<div class="search-overlay__hint">Start typing to search our collection…</div>';
      return;
    }
    const q = query.toLowerCase();
    const matches = searchProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      searchResults.innerHTML = `<div class="search-overlay__hint">No results for "${query}"</div>`;
      return;
    }

    searchResults.innerHTML = matches.map(p => `
      <a href="${p.url}" class="search-result">
        <img src="${p.img}" alt="${p.name}" class="search-result__img">
        <div class="search-result__info">
          <div class="search-result__name">${p.name}</div>
          <div class="search-result__type">${p.type}</div>
        </div>
        <div class="search-result__price">₹${p.price.toLocaleString('en-IN')}</div>
      </a>
    `).join('');
  }

  // Bind search buttons
  const searchBtn = document.getElementById('searchBtn') || document.querySelector('[aria-label="Search"]');
  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);
  searchOverlay.addEventListener('click', (e) => { if (e.target === searchOverlay) closeSearch(); });
  if (searchInput) searchInput.addEventListener('input', (e) => performSearch(e.target.value));

  // Quick search tags
  searchOverlay.querySelectorAll('.search-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      searchInput.value = tag.dataset.q;
      performSearch(tag.dataset.q);
    });
  });

  // ESC to close search
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) closeSearch();
    if (e.key === 'Escape' && document.querySelector('.quickview.active')) closeQuickView();
    if (e.key === 'Escape' && authModal.classList.contains('active')) closeAuthModal();
  });

  // ===== QUICK-VIEW MODAL =====
  const productDetails = {
    'Classic Assam Breakfast': { desc: 'A bold, full-bodied black tea from the finest Assam estates. Rich malty character with a brisk, coppery liquor.', notes: 'Malt • Honey • Caramel', origin: 'Assam, India', caffeine: 'High' },
    'Himalayan Green Reserve': { desc: 'Hand-picked at dawn from high-altitude gardens. Light, refreshing with sweet vegetal notes and a clean finish.', notes: 'Grass • Jasmine • Sweet Pea', origin: 'Darjeeling, India', caffeine: 'Medium' },
    'Heritage Spiced Chai': { desc: 'Our signature masala chai — bold CTC tea blended with freshly ground cardamom, cinnamon, ginger, and cloves.', notes: 'Cardamom • Cinnamon • Ginger', origin: 'Assam, India', caffeine: 'High' },
    'Moonlight White Peony': { desc: 'Rare, hand-plucked white tea buds with delicate floral sweetness. Best enjoyed in quiet afternoon solitude.', notes: 'Peach • Honey • Lily', origin: 'Fujian, China', caffeine: 'Low' },
    'Turmeric Golden Glow': { desc: 'Anti-inflammatory wellness blend with organic turmeric, black pepper, and warming spices for radiant health.', notes: 'Turmeric • Pepper • Ginger', origin: 'Kerala, India', caffeine: 'None' },
    'Rose Chamomile Dream': { desc: 'A soothing nighttime tisane of chamomile flowers, rose petals, and lavender for peaceful rest.', notes: 'Rose • Chamomile • Lavender', origin: 'Rajasthan, India', caffeine: 'None' },
    'Darjeeling Muscatel Oolong': { desc: 'The champagne of teas — a complex muscatel character with fruity undertones from single-estate Darjeeling gardens.', notes: 'Muscatel • Grape • Oak', origin: 'Darjeeling, India', caffeine: 'Medium' },
    'Spring Flush Sencha': { desc: 'Bright, emerald green tea with umami depth and a crisp vegetal character from early spring harvest.', notes: 'Umami • Grass • Marine', origin: 'Shizuoka, Japan', caffeine: 'Medium' },
    'First Flush Darjeeling': { desc: 'The first harvest of spring — delicate, aromatic, with floral complexity and a bright champagne-like character.', notes: 'Floral • Apricot • Muscatel', origin: 'Darjeeling, India', caffeine: 'Medium' },
    'Peppermint Detox': { desc: 'Cooling organic peppermint leaves blended with detoxifying green tea for digestive wellness and clarity.', notes: 'Mint • Green Tea • Lemon', origin: 'Nilgiri, India', caffeine: 'Low' },
    'Ceremonial Matcha': { desc: 'Stone-ground ceremonial grade matcha from shade-grown tencha leaves. Vivid green with rich umami sweetness.', notes: 'Umami • Cream • Grass', origin: 'Uji, Japan', caffeine: 'High' },
    'Silver Needle White': { desc: 'The rarest white tea — only unopened buds picked at dawn. Ethereal sweetness with a silken mouthfeel.', notes: 'Melon • Honey • Silk', origin: 'Fujian, China', caffeine: 'Low' },
  };

  // Create quick-view modal
  const quickviewEl = document.createElement('div');
  quickviewEl.className = 'quickview';
  quickviewEl.innerHTML = `
    <div class="quickview__overlay"></div>
    <div class="quickview__dialog">
      <button class="quickview__close" aria-label="Close">&times;</button>
      <div class="quickview__grid">
        <div class="quickview__img-wrap">
          <img src="" alt="" class="quickview__img" id="qvImg">
        </div>
        <div class="quickview__info">
          <div class="quickview__type" id="qvType"></div>
          <h2 class="quickview__name" id="qvName"></h2>
          <div class="quickview__price" id="qvPrice"></div>
          <p class="quickview__desc" id="qvDesc"></p>
          <div class="quickview__meta">
            <div class="quickview__meta-item"><span class="quickview__meta-label">Tasting Notes</span><span id="qvNotes"></span></div>
            <div class="quickview__meta-item"><span class="quickview__meta-label">Origin</span><span id="qvOrigin"></span></div>
            <div class="quickview__meta-item"><span class="quickview__meta-label">Caffeine</span><span id="qvCaffeine"></span></div>
          </div>
          <div class="quickview__sizes">
            <span class="quickview__meta-label">Size</span>
            <div class="quickview__size-options">
              <button class="quickview__size" data-mult="0.6">50g</button>
              <button class="quickview__size active" data-mult="1">100g</button>
              <button class="quickview__size" data-mult="1.8">200g</button>
            </div>
          </div>
          <div class="quickview__actions">
            <div class="quickview__qty">
              <button class="quickview__qty-btn" id="qvMinus">−</button>
              <span id="qvQty">1</span>
              <button class="quickview__qty-btn" id="qvPlus">+</button>
            </div>
            <button class="btn btn--primary quickview__add-btn" id="qvAddToCart">Add to Cart</button>
          </div>
          <a href="product.html" class="quickview__view-full">View Full Details →</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(quickviewEl);

  let qvCurrentProduct = null;
  let qvQty = 1;
  let qvPriceMult = 1;

  function openQuickView(productName) {
    const product = searchProducts.find(p => p.name === productName);
    if (!product) return;
    qvCurrentProduct = product;
    qvQty = 1;
    qvPriceMult = 1;

    const details = productDetails[productName] || { desc: 'A premium artisanal tea from our curated collection.', notes: '—', origin: 'India', caffeine: 'Medium' };

    document.getElementById('qvImg').src = product.img;
    document.getElementById('qvImg').alt = product.name;
    document.getElementById('qvType').textContent = product.type;
    document.getElementById('qvName').textContent = product.name;
    document.getElementById('qvPrice').textContent = '\u20b9' + product.price.toLocaleString('en-IN');
    document.getElementById('qvDesc').textContent = details.desc;
    document.getElementById('qvNotes').textContent = details.notes;
    document.getElementById('qvOrigin').textContent = details.origin;
    document.getElementById('qvCaffeine').textContent = details.caffeine;
    document.getElementById('qvQty').textContent = '1';

    // Reset size selection
    quickviewEl.querySelectorAll('.quickview__size').forEach(s => s.classList.remove('active'));
    quickviewEl.querySelector('.quickview__size[data-mult="1"]').classList.add('active');

    quickviewEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickView() {
    quickviewEl.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Quick-view event delegation
  quickviewEl.querySelector('.quickview__close').addEventListener('click', closeQuickView);
  quickviewEl.querySelector('.quickview__overlay').addEventListener('click', closeQuickView);

  document.getElementById('qvMinus').addEventListener('click', () => {
    if (qvQty > 1) { qvQty--; document.getElementById('qvQty').textContent = qvQty; }
  });
  document.getElementById('qvPlus').addEventListener('click', () => {
    qvQty++; document.getElementById('qvQty').textContent = qvQty;
  });

  quickviewEl.querySelectorAll('.quickview__size').forEach(btn => {
    btn.addEventListener('click', () => {
      quickviewEl.querySelectorAll('.quickview__size').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      qvPriceMult = parseFloat(btn.dataset.mult);
      const adjustedPrice = Math.round(qvCurrentProduct.price * qvPriceMult);
      document.getElementById('qvPrice').textContent = '\u20b9' + adjustedPrice.toLocaleString('en-IN');
    });
  });

  document.getElementById('qvAddToCart').addEventListener('click', () => {
    if (!qvCurrentProduct) return;
    const adjustedPrice = Math.round(qvCurrentProduct.price * qvPriceMult);
    for (let i = 0; i < qvQty; i++) {
      window.addToCart(qvCurrentProduct.name, adjustedPrice);
    }
    closeQuickView();
  });

  // Attach quick-view to product cards
  document.querySelectorAll('.product-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking add-to-cart button or quick-view button
      if (e.target.closest('.btn') || e.target.closest('.product-card__quick')) return;
      const nameEl = card.querySelector('.product-card__name');
      if (nameEl) openQuickView(nameEl.textContent.trim());
    });
  });

  window.openQuickView = openQuickView;

  // ===== COMMERCE TABS =====
  document.querySelectorAll('.commerce-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.commerce-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.querySelectorAll('[id^="tab-"]').forEach(panel => panel.style.display = 'none');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.style.display = '';
    });
  });

  // ===== PDP TABS =====
  document.querySelectorAll('.pdp-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pdp-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pdp-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // ===== PDP GALLERY =====
  const mainImg = document.querySelector('.pdp-gallery__main');
  document.querySelectorAll('.pdp-gallery__thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.pdp-gallery__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImg) {
        const emoji = thumb.querySelector('span')?.textContent || thumb.dataset.img || '';
        mainImg.innerHTML = `<span style="font-size:6rem">${emoji}</span>`;
      }
    });
  });

  // ===== PDP QUANTITY =====
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyValue = document.getElementById('qtyValue');

  if (qtyMinus && qtyPlus && qtyValue) {
    qtyMinus.addEventListener('click', () => {
      let v = parseInt(qtyValue.textContent);
      if (v > 1) qtyValue.textContent = v - 1;
    });
    qtyPlus.addEventListener('click', () => {
      let v = parseInt(qtyValue.textContent);
      qtyValue.textContent = v + 1;
    });
  }

  // ===== PDP SIZE SELECTOR =====
  document.querySelectorAll('.pdp-size').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pdp-size').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ===== FAQ ACCORDION =====
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isActive = item.classList.contains('active');

      // close all
      document.querySelectorAll('.faq-item').forEach(fi => {
        fi.classList.remove('active');
        fi.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ===== PLP FILTERS =====
  const filterGroups = document.querySelectorAll('.filter-group__title');
  filterGroups.forEach(title => {
    title.addEventListener('click', () => {
      title.closest('.filter-group').classList.toggle('collapsed');
    });
  });

  // PLP Sort
  const sortSelect = document.getElementById('plpSort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const grid = document.querySelector('.plp-products');
      if (!grid) return;
      const cards = [...grid.querySelectorAll('.product-card')];
      const sortBy = sortSelect.value;

      cards.sort((a, b) => {
        const priceA = parseInt(a.dataset.price || 0);
        const priceB = parseInt(b.dataset.price || 0);
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'newest') return parseInt(b.dataset.date || 0) - parseInt(a.dataset.date || 0);
        return 0; // popular = default
      });

      cards.forEach(card => grid.appendChild(card));
    });
  }

  // Mobile filter toggle
  const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
  const plpSidebar = document.querySelector('.plp-sidebar');
  if (mobileFilterToggle && plpSidebar) {
    mobileFilterToggle.addEventListener('click', () => {
      plpSidebar.classList.toggle('active');
      document.body.style.overflow = plpSidebar.classList.contains('active') ? 'hidden' : '';
    });
  }

  // PLP filter checkboxes
  document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const activeFilters = {};
      document.querySelectorAll('.filter-group').forEach(group => {
        const filterType = group.dataset.filter;
        const checked = [...group.querySelectorAll('input:checked')].map(c => c.value);
        if (checked.length) activeFilters[filterType] = checked;
      });

      document.querySelectorAll('.plp-products .product-card').forEach(card => {
        let visible = true;
        for (const [type, values] of Object.entries(activeFilters)) {
          const cardVal = card.dataset[type] || '';
          if (!values.some(v => cardVal.toLowerCase().includes(v.toLowerCase()))) {
            visible = false;
            break;
          }
        }
        card.style.display = visible ? '' : 'none';
      });

      // Update count
      const countEl = document.querySelector('.plp-topbar__count');
      if (countEl) {
        const visible = document.querySelectorAll('.plp-products .product-card[style=""], .plp-products .product-card:not([style])').length;
        countEl.textContent = `Showing ${visible} teas`;
      }
    });
  });

  // ===== LOAD MORE =====
  const loadMoreBtn = document.getElementById('loadMore');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      const hidden = document.querySelectorAll('.plp-products .product-card.hidden-card');
      hidden.forEach((card, i) => {
        if (i < 4) card.classList.remove('hidden-card');
      });
      if (document.querySelectorAll('.plp-products .product-card.hidden-card').length === 0) {
        loadMoreBtn.style.display = 'none';
      }
    });
  }

  // ===== SCROLL ANIMATIONS =====
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(el => obs.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  // ===== HEADER SCROLL =====
  const header = document.getElementById('header');
  let lastScroll = 0;
  if (header) {
    window.addEventListener('scroll', () => {
      const current = window.scrollY;
      if (current > 100) {
        header.style.boxShadow = 'var(--shadow-md)';
      } else {
        header.style.boxShadow = 'none';
      }
      lastScroll = current;
    }, { passive: true });
  }

  // ===== BACK TO TOP =====
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.innerHTML = '↑';
  backToTop.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(backToTop);

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== WHATSAPP FLOATING BUTTON =====
  const waBtn = document.createElement('a');
  waBtn.href = 'https://wa.me/919673592818?text=Hi%20feelinga!%20I%20have%20a%20question%20about%20your%20teas.';
  waBtn.target = '_blank';
  waBtn.rel = 'noopener noreferrer';
  waBtn.className = 'whatsapp-float';
  waBtn.setAttribute('aria-label', 'Chat with us on WhatsApp');
  waBtn.innerHTML = `
    <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff">
      <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.502 1.14 6.746 3.072 9.378L1.06 31.116l5.96-1.966a15.93 15.93 0 0 0 8.984 2.754C24.826 31.904 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.53 22.598c-.4 1.126-1.978 2.06-3.24 2.334-.862.184-1.99.332-5.784-1.244-4.854-2.018-7.98-6.942-8.222-7.264-.232-.322-1.95-2.602-1.95-4.962s1.234-3.52 1.672-4.002c.438-.482.958-.602 1.276-.602.318 0 .636.002.914.016.294.016.688-.112 1.076.82.4.962 1.362 3.322 1.482 3.564.12.242.2.524.04.846-.16.322-.24.524-.482.806-.242.282-.508.63-.726.846-.242.242-.494.504-.212.988.282.484 1.254 2.072 2.694 3.356 1.852 1.65 3.414 2.162 3.898 2.404.484.242.766.202 1.048-.122.282-.322 1.214-1.414 1.536-1.898.322-.484.644-.404 1.088-.242.444.162 2.804 1.322 3.288 1.564.484.242.806.362.926.564.12.202.12 1.166-.28 2.292z"/>
    </svg>
    <span class="whatsapp-float__tooltip">Chat with us!</span>
  `;
  document.body.appendChild(waBtn);
  // ===== SHOP FILTERS & SORT =====
  const plpProducts = document.querySelector('.plp-products');
  if (plpProducts) {
    const cards = Array.from(plpProducts.querySelectorAll('.product-card'));
    const filterGroups = document.querySelectorAll('.filter-group');
    const sortSelect = document.getElementById('plpSort');
    const countDisplay = document.querySelector('.plp-topbar__count');
    const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
    const sidebar = document.querySelector('.plp-sidebar');

    // Mobile filter toggle
    if (mobileFilterToggle && sidebar) {
      mobileFilterToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        mobileFilterToggle.textContent = sidebar.classList.contains('open') ? '✕ Close' : '☰ Filters';
      });
    }

    function getActiveFilters() {
      const filters = {};
      filterGroups.forEach(group => {
        const key = group.dataset.filter;
        const checked = Array.from(group.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        if (checked.length > 0) filters[key] = checked;
      });
      return filters;
    }

    function matchesPrice(cardPrice, priceFilter) {
      const p = parseInt(cardPrice, 10);
      return priceFilter.some(range => {
        if (range === 'under500') return p < 500;
        if (range === '500-999') return p >= 500 && p <= 999;
        if (range === '1000-plus') return p >= 1000;
        return false;
      });
    }

    function applyFilters() {
      const filters = getActiveFilters();
      let visibleCount = 0;

      cards.forEach(card => {
        let show = true;

        if (filters.type && !filters.type.includes(card.dataset.type)) show = false;
        if (filters.mood && !filters.mood.includes(card.dataset.mood)) show = false;
        if (filters.origin && !filters.origin.includes(card.dataset.origin)) show = false;
        if (filters.price && !matchesPrice(card.dataset.price, filters.price)) show = false;

        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      if (countDisplay) {
        countDisplay.textContent = `Showing ${visibleCount} tea${visibleCount !== 1 ? 's' : ''}`;
      }
    }

    function applySort() {
      if (!sortSelect) return;
      const val = sortSelect.value;
      const sorted = [...cards].sort((a, b) => {
        const pa = parseInt(a.dataset.price, 10);
        const pb = parseInt(b.dataset.price, 10);
        const da = parseInt(a.dataset.date || '0', 10);
        const db = parseInt(b.dataset.date || '0', 10);
        switch (val) {
          case 'price-asc': return pa - pb;
          case 'price-desc': return pb - pa;
          case 'newest': return db - da;
          default: return 0; // popular = original order
        }
      });
      sorted.forEach(card => plpProducts.appendChild(card));
    }

    // Wire up filter checkboxes
    filterGroups.forEach(group => {
      group.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          applyFilters();
        });
      });
    });

    // Wire up sort
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        applySort();
        applyFilters();
      });
    }
  }

});
