'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext<any>(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('feelinga_cart');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate new format (must have id field); clear old-format carts
                if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].id) {
                    localStorage.removeItem('feelinga_cart');
                } else {
                    setCart(parsed);
                }
            }
        } catch { /* ignore corrupt data */ }
    }, []);

    useEffect(() => {
        localStorage.setItem('feelinga_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = ({ id, slug, name, price, size = '100g', img }) => {
        const key = `${id}_${size}`;
        setCart(prev => {
            const existing = prev.find(i => i.key === key);
            if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { key, id, slug, name, price, size, img, qty: 1 }];
        });
        setCartOpen(true);
    };

    const removeFromCart = (key) => setCart(prev => prev.filter(i => i.key !== key));
    const updateQty = (key, qty) => {
        if (qty <= 0) return removeFromCart(key);
        setCart(prev => prev.map(i => i.key === key ? { ...i, qty } : i));
    };
    const clearCart = () => setCart([]);

    const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal >= 999 ? 0 : 79;

    return (
        <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, clearCart, itemCount, subtotal, shipping }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() { return useContext(CartContext); }
