import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🍃</div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>404</h1>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 400, marginBottom: '1rem' }}>Page Not Found</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '420px' }}>
                The page you&apos;re looking for has gone the way of yesterday&apos;s tea leaves. Let us help you find something fresh.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link href="/shop" className="btn btn--primary">Explore Teas</Link>
                <Link href="/" className="btn btn--ghost">Go Home</Link>
            </div>
        </div>
    );
}
