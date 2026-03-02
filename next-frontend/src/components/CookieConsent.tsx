'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'feelinga_cookie_consent';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Show banner only if user hasn't already consented
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Small delay so the page paints first
            const timer = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setVisible(false);
    };

    const decline = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: '94%',
                maxWidth: '520px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                animation: 'fadeInUp .4s ease',
            }}
        >
            <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
                We use cookies and local storage to keep you signed in and remember your cart.
                No third-party tracking. See our{' '}
                <Link href="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                    onClick={decline}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '0.45rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: 'inherit',
                    }}
                >
                    Decline
                </button>
                <button
                    onClick={accept}
                    style={{
                        background: 'var(--color-accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 1.2rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                    }}
                >
                    Accept
                </button>
            </div>
        </div>
    );
}
