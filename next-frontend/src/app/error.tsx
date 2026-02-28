'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '480px' }}>
                We&apos;re sorry — an unexpected error occurred. Please try again or return to the homepage.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn--primary" onClick={reset}>Try Again</button>
                <a href="/" className="btn btn--ghost">Go Home</a>
            </div>
        </div>
    );
}
