export default function Loading() {
    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div
                    style={{
                        width: 48,
                        height: 48,
                        border: '3px solid var(--color-border, #e5e5e5)',
                        borderTopColor: 'var(--color-primary, #2d6a4f)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 1rem',
                    }}
                />
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Loading...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
