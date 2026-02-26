'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('feelinga_cart');
        if (stored) setCart(JSON.parse(stored));
    }, []);

    useEffect(() => {
        localStorage.setItem('feelinga_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (name, price, img) => {
        setCart(prev => {
            const existing = prev.find(i => i.name === name);
            if (existing) return prev.map(i => i.name === name ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { name, price, img, qty: 1 }];
        });
        setCartOpen(true);
    };

    const removeFromCart = (name) => setCart(prev => prev.filter(i => i.name !== name));
    const updateQty = (name, qty) => {
        if (qty <= 0) return removeFromCart(name);
        setCart(prev => prev.map(i => i.name === name ? { ...i, qty } : i));
    };
    const clearCart = () => setCart([]);

    const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal >= 999 ? 0 : 49;

    return (
        <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, clearCart, itemCount, subtotal, shipping }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() { return useContext(CartContext); }
