'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';

export default function VerifyEmail() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }
        async function verify() {
            try {
                const res = await fetch('/api/v1/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
                const data = await res.json().catch(() => ({}) as any);
                if (!res.ok) throw new Error(data.message || 'Verification failed');
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Verification failed. The link may have expired.');
            }
        }
        verify();
    }, [token]);

    return (
        <Layout>
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: 480, padding: 'var(--space-2xl)' }}>
                    {status === 'loading' && (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>⏳</div>
                            <h2>Verifying your email...</h2>
                            <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Please wait while we confirm your email address.</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>✅</div>
                            <h2>Email Verified!</h2>
                            <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>{message}</p>
                            <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-text-muted)' }}>You can now enjoy all features of your account.</p>
                            <Link href="/shop" className="btn btn--primary" style={{ marginTop: 'var(--space-xl)', display: 'inline-block' }}>Start Shopping</Link>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>❌</div>
                            <h2>Verification Failed</h2>
                            <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-muted)' }}>{message}</p>
                            <Link href="/" className="btn btn--ghost" style={{ marginTop: 'var(--space-xl)', display: 'inline-block' }}>Go Home</Link>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}
