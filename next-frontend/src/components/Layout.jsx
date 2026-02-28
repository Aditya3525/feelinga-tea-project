'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import SearchOverlay from './SearchOverlay';

export default function Layout({ children }) {
    const { isAuthenticated, openAuthModal, user } = useAuth();
    const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, itemCount, subtotal } = useCart();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const [mobileNav, setMobileNav] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/shop', label: 'Shop' },
        { href: '/shop#moods', label: 'Moods' },
        { href: '/gifting', label: 'Gifting' },
        { href: '/learn', label: 'Learn' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
    ];

    return (
        <>
            {/* HEADER */}
            <header className="header" id="header">
                <div className="header__inner">
                    <Link href="/" className="header__logo" aria-label="feelinga Home">feelinga<span>.</span></Link>
                    <nav className="header__nav" aria-label="Main navigation">
                        {navLinks.map(l => (
                            <Link key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>{l.label}</Link>
                        ))}
                    </nav>
                    <div className="header__actions">
                        <button aria-label="Search" onClick={() => setSearchOpen(true)}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        </button>
                        <button aria-label="Toggle theme" onClick={toggleTheme}>
                            {theme === 'dark' ? (
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                            ) : (
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                            )}
                        </button>
                        {mounted && isAuthenticated ? (
                            <Link href="/profile" aria-label="Account">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </Link>
                        ) : (
                            <button aria-label="Account" onClick={mounted ? openAuthModal : undefined}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </button>
                        )}
                        <button aria-label="Cart" id="cartBtn" onClick={() => setCartOpen(true)}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                            {mounted && itemCount > 0 && <span className="cart-count" id="cartCount">{itemCount}</span>}
                        </button>
                        <button className={`hamburger ${mobileNav ? 'active' : ''}`} id="hamburger" aria-label="Menu" onClick={() => setMobileNav(!mobileNav)}>
                            <span></span><span></span><span></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MOBILE NAV */}
            <nav className={`mobile-nav ${mobileNav ? 'active' : ''}`} id="mobileNav" aria-label="Mobile navigation">
                {navLinks.map(l => (
                    <Link key={l.href} href={l.href} onClick={() => setMobileNav(false)}>{l.label}</Link>
                ))}
                <Link href="/faq" onClick={() => setMobileNav(false)}>FAQ</Link>
            </nav>

            {/* CART DRAWER */}
            <div className={`cart-overlay ${cartOpen ? 'active' : ''}`} id="cartOverlay" onClick={() => setCartOpen(false)}></div>
            <aside className={`cart-drawer ${cartOpen ? 'active' : ''}`} id="cartDrawer" aria-label="Shopping cart">
                <div className="cart-drawer__header">
                    <h3>Your Cart</h3>
                    <button id="cartClose" aria-label="Close cart" onClick={() => setCartOpen(false)}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="cart-drawer__items" id="cartItems">
                    {cart.length === 0 ? (
                        <div className="cart-empty"><div className="icon">🍃</div><p>Your cart is empty</p></div>
                    ) : (
                        cart.map((item, i) => (
                            <div className="cart-item" key={item.key}>
                                <div className="cart-item__img">{item.img ? <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : '🍵'}</div>
                                <div className="cart-item__details">
                                    <div className="cart-item__name">{item.name}</div>
                                    <div className="cart-item__price">₹{item.price} × {item.qty} · {item.size || '100g'}</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                        <button onClick={() => updateQty(item.key, item.qty - 1)}>−</button>
                                        <span>{item.qty}</span>
                                        <button onClick={() => updateQty(item.key, item.qty + 1)}>+</button>
                                    </div>
                                    <div className="cart-item__remove" onClick={() => removeFromCart(item.key)}>Remove</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="cart-drawer__footer">
                    <div className="cart-drawer__total"><span>Subtotal</span><span id="cartTotal">₹{subtotal}</span></div>
                    <Link href="/checkout" className="btn btn--primary" style={{ width: '100%', textAlign: 'center' }} onClick={() => setCartOpen(false)}>Checkout</Link>
                </div>
            </aside>

            {/* SEARCH */}
            <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* MAIN CONTENT */}
            <main id="main">{children}</main>

            {/* FOOTER */}
            <footer className="footer">
                <div className="container">
                    <div className="footer__grid">
                        <div className="footer__brand">
                            <Link href="/" className="header__logo" style={{ color: '#fff' }}>feelinga<span>.</span></Link>
                            <p>happiness is here. Sourced with care from India&apos;s finest estates, delivered fresh to your doorstep.</p>
                            <div className="footer__social"><a href="#" aria-label="Instagram">IG</a><a href="#" aria-label="Facebook">FB</a><a href="#" aria-label="Twitter">TW</a><a href="#" aria-label="Pinterest">PI</a></div>
                        </div>
                        <div>
                            <h4 className="footer__heading">Shop</h4>
                            <div className="footer__links"><Link href="/shop">All Teas</Link><Link href="/shop">Green Tea</Link><Link href="/shop">Black Tea</Link><Link href="/shop">Herbal &amp; Wellness</Link><Link href="/gifting">Gift Sets</Link></div>
                        </div>
                        <div>
                            <h4 className="footer__heading">Company</h4>
                            <div className="footer__links"><Link href="/about">About Us</Link><Link href="/learn">Blog &amp; Guides</Link><Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link><a href="#">Careers</a></div>
                        </div>
                        <div>
                            <h4 className="footer__heading">Help</h4>
                            <div className="footer__links"><a href="#">Shipping &amp; Returns</a><a href="#">Track Order</a><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div>
                        </div>
                    </div>
                    <div className="footer__bottom">
                        <span>© 2026 feelinga. All rights reserved.</span>
                        <span>Made with 🍃 in India</span>
                        <Link href="/admin" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Admin Access</Link>
                    </div>
                </div>
            </footer>

            {/* WHATSAPP FLOATING BUTTON */}
            <a href="https://wa.me/919673592818" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                <span className="whatsapp-float__tooltip">Chat with us!</span>
            </a>

            {/* BACK TO TOP */}
            <button className={`back-to-top ${showBackToTop ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6" /></svg>
            </button>
        </>
    );
}
