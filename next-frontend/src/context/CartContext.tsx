'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext<any>(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const initializedRef = useRef(false);
    const { isAuthenticated } = useAuth();

    const isLoggedIn = () => isAuthenticated && typeof window !== 'undefined' && !!localStorage.getItem('feelinga_token');

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('feelinga_cart');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].id) {
                    localStorage.removeItem('feelinga_cart');
                } else {
                    setCart(parsed);
                }
            }
        } catch (err) {
            console.warn('[Cart] Failed to parse stored cart:', err instanceof Error ? err.message : err);
            localStorage.removeItem('feelinga_cart');
        }
        initializedRef.current = true;
    }, []);

    // Persist to localStorage whenever cart changes (after init)
    useEffect(() => {
        if (initializedRef.current) {
            localStorage.setItem('feelinga_cart', JSON.stringify(cart));
        }
    }, [cart]);

    // Auto-sync cart when user logs in
    const prevAuthRef = useRef(false);
    useEffect(() => {
        if (isAuthenticated && !prevAuthRef.current && initializedRef.current) {
            syncCartOnLogin();
        }
        prevAuthRef.current = isAuthenticated;
    }, [isAuthenticated]);

    // Fetch server cart and merge
    const fetchServerCart = useCallback(async () => {
        if (!isLoggedIn()) return;
        try {
            const data = await apiRequest('/cart');
            const serverItems = (data.data?.items || []).map((item: any) => ({
                key: `${item.productId}_${item.size}`,
                id: item.productId,
                slug: item.slug,
                name: item.name,
                price: item.price,
                size: item.size,
                img: item.image,
                qty: item.qty,
                cartItemId: item.id,
            }));
            setCart(serverItems);
        } catch (err) {
            console.warn('[Cart] Failed to fetch server cart:', err instanceof Error ? err.message : err);
            // Silently fail — keep local cart
        }
    }, []);

    // Sync localStorage cart to server on login, then fetch server cart
    const syncCartOnLogin = useCallback(async () => {
        if (!isLoggedIn()) return;
        setSyncing(true);
        try {
            const localCart = JSON.parse(localStorage.getItem('feelinga_cart') || '[]');
            if (localCart.length > 0) {
                const items = localCart.map((i: any) => ({
                    productId: i.id,
                    slug: i.slug,
                    name: i.name,
                    size: i.size || '100g',
                    qty: i.qty,
                }));
                await apiRequest('/cart/sync', {
                    method: 'POST',
                    body: JSON.stringify({ items }),
                });
            }
            await fetchServerCart();
        } catch (err) {
            console.warn('[Cart] Failed to sync cart on login:', err instanceof Error ? err.message : err);
            // Keep local cart as fallback
        } finally {
            setSyncing(false);
        }
    }, [fetchServerCart]);

    const addToCart = async ({ id, slug, name, price, size = '100g', img }) => {
        const key = `${id}_${size}`;
        // Optimistic local update
        setCart(prev => {
            const existing = prev.find(i => i.key === key);
            if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { key, id, slug, name, price, size, img, qty: 1 }];
        });
        setCartOpen(true);

        // Sync to server if logged in
        if (isLoggedIn()) {
            try {
                await apiRequest('/cart/items', {
                    method: 'POST',
                    body: JSON.stringify({ productId: id, size, qty: 1 }),
                });
                await fetchServerCart();
            } catch {
                // Local update already applied
            }
        }
    };

    const removeFromCart = async (key: string) => {
        const item = cart.find(i => i.key === key);
        setCart(prev => prev.filter(i => i.key !== key));

        if (isLoggedIn() && item?.cartItemId) {
            try {
                await apiRequest(`/cart/items/${item.cartItemId}`, { method: 'DELETE' });
            } catch { /* local fallback */ }
        }
    };

    const updateQty = async (key: string, qty: number) => {
        if (qty <= 0) return removeFromCart(key);
        const item = cart.find(i => i.key === key);
        setCart(prev => prev.map(i => i.key === key ? { ...i, qty } : i));

        if (isLoggedIn() && item?.cartItemId) {
            try {
                await apiRequest(`/cart/items/${item.cartItemId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ qty }),
                });
            } catch { /* local fallback */ }
        }
    };

    const clearCart = async () => {
        setCart([]);
        if (isLoggedIn()) {
            try {
                await apiRequest('/cart', { method: 'DELETE' });
            } catch { /* local fallback */ }
        }
    };

    const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal >= 999 ? 0 : 79;

    return (
        <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, clearCart, itemCount, subtotal, shipping, syncCartOnLogin, fetchServerCart, syncing }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() { return useContext(CartContext); }
