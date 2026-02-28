'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '../../components/Layout';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Reset failed');
            setSuccess(true);
            setTimeout(() => router.push('/'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Layout>
                <div className="container section" style={{ textAlign: 'center', padding: 'var(--space-4xl) 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🔗</div>
                    <h2>Invalid Reset Link</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-md)' }}>
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container section" style={{ maxWidth: 440, margin: '0 auto', padding: 'var(--space-4xl) var(--space-lg)' }}>
                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>✅</div>
                        <h2>Password Reset!</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-md)' }}>
                            Your password has been updated. Redirecting to login...
                        </p>
                    </div>
                ) : (
                    <>
                        <h2 style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>Set New Password</h2>
                        {error && (
                            <div style={{ background: 'var(--color-error-light, #fef2f2)', color: 'var(--color-error, #dc2626)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.9rem' }}>New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '1rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.9rem' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Repeat your password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '1rem' }}
                                />
                            </div>
                            <button type="submit" className="btn btn--primary" disabled={loading} style={{ marginTop: 'var(--space-sm)' }}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </Layout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
