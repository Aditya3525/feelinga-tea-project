'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { apiRequest } from '../utils/api';

declare global {
    interface Window { google?: any; }
}

export default function AuthModal() {
    const { showAuthModal, closeAuthModal, login, register, googleLogin } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSent, setForgotSent] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleGoogleLogin = useCallback(async (response) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(response.credential);
            showToast('Welcome! 🍵', 'success');
            closeAuthModal();
        } catch (err) {
            setError(err.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    }, [googleLogin, showToast, closeAuthModal]);

    useEffect(() => {
        if (!showAuthModal) return;
        const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!GOOGLE_CLIENT_ID) return;

        // Load the GSI script once
        if (!document.getElementById('google-gsi-script')) {
            const script = document.createElement('script');
            script.id = 'google-gsi-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                window.google?.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleLogin,
                });
                const btnContainer = document.getElementById('google-signin-btn');
                if (btnContainer) {
                    window.google.accounts.id.renderButton(btnContainer, {
                        theme: 'outline', size: 'large', width: '100%', text: 'continue_with',
                    });
                }
            };
            document.head.appendChild(script);
        } else if (window.google?.accounts) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleLogin,
            });
            const btnContainer = document.getElementById('google-signin-btn');
            if (btnContainer) {
                btnContainer.innerHTML = '';
                window.google.accounts.id.renderButton(btnContainer, {
                    theme: 'outline', size: 'large', width: '100%', text: 'continue_with',
                });
            }
        }
    }, [showAuthModal, handleGoogleLogin]);

    // Focus trap + Escape key handler (runs when modal is shown)
    useEffect(() => {
        if (!showAuthModal || !dialogRef.current) return;
        const dialog = dialogRef.current;

        // Focus the dialog so keyboard events work
        dialog.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { closeAuthModal(); return; }
            if (e.key !== 'Tab') return;
            const focusable = dialog.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showAuthModal, closeAuthModal, activeTab, showForgot]);

    if (!showAuthModal) return null;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(e.target.email.value, e.target.password.value);
            showToast('Welcome back! 🍵', 'success');
            closeAuthModal();
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (e.target.password.value !== e.target.confirm.value) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            await register(e.target.name.value, e.target.email.value, e.target.password.value);
            showToast('Account created! Welcome to Feelinga 🍵', 'success');
            closeAuthModal();
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiRequest('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: forgotEmail }),
            });
            setForgotSent(true);
        } catch {
            // Even if email not found, show success (security best practice)
            setForgotSent(true);
        } finally { setLoading(false); }
    };

    const switchTab = (tab) => { setActiveTab(tab); setError(''); setShowForgot(false); setForgotSent(false); };

    return (
        <div className="auth-modal active">
            <div className="auth-modal__overlay" onClick={closeAuthModal}></div>
            <div className="auth-modal__dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={activeTab === 'login' ? 'Sign in' : 'Create account'}>
                <button className="auth-modal__close" onClick={closeAuthModal} aria-label="Close">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>

                {showForgot ? (
                    <>
                        <div className="auth-modal__header">
                            <h2 className="auth-modal__title">Reset Password</h2>
                            <p className="auth-modal__subtitle">Enter your email to receive a reset link</p>
                        </div>
                        {forgotSent ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📬</div>
                                <p style={{ fontWeight: 600 }}>Check your inbox!</p>
                                <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-xs)', fontSize: '0.9rem' }}>
                                    If an account exists for <strong>{forgotEmail}</strong>, we&apos;ve sent a password reset link.
                                </p>
                                <button className="btn btn--ghost btn--sm" style={{ marginTop: 'var(--space-lg)' }} onClick={() => { setShowForgot(false); setForgotSent(false); }}>
                                    ← Back to Login
                                </button>
                            </div>
                        ) : (
                            <form className="auth-modal__form" onSubmit={handleForgotPassword}>
                                <div className="auth-modal__field">
                                    <label htmlFor="forgotEmail">Email Address</label>
                                    <input
                                        type="email" id="forgotEmail" required
                                        placeholder="your@email.com"
                                        value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn--primary auth-modal__submit" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                                    <button type="button" className="auth-modal__toggle" onClick={() => setShowForgot(false)}>← Back to Login</button>
                                </div>
                            </form>
                        )}
                    </>
                ) : (
                    <>
                        <div className="auth-modal__header">
                            <h2 className="auth-modal__title">
                                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="auth-modal__subtitle">
                                {activeTab === 'login' ? 'Sign in to your Feelinga account' : 'Join the tea community'}
                            </p>
                        </div>
                        <div className="auth-modal__tabs" role="tablist">
                            <button className={`auth-modal__tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Login</button>
                            <button className={`auth-modal__tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => switchTab('signup')}>Sign Up</button>
                        </div>
                        {error && <div className="auth-modal__error" style={{ display: 'block' }}>{error}</div>}

                        {activeTab === 'login' ? (
                            <form className="auth-modal__form" onSubmit={handleLogin}>
                                <div className="auth-modal__field">
                                    <label htmlFor="loginEmail">Email</label>
                                    <input type="email" id="loginEmail" name="email" required placeholder="your@email.com" />
                                </div>
                                <div className="auth-modal__field">
                                    <label htmlFor="loginPassword">Password</label>
                                    <input type="password" id="loginPassword" name="password" required placeholder="Min 8 characters" />
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
                                    <button type="button" className="auth-modal__toggle" style={{ fontSize: '0.85rem' }} onClick={() => setShowForgot(true)}>
                                        Forgot password?
                                    </button>
                                </div>
                                <button type="submit" className="btn btn--primary auth-modal__submit" disabled={loading}>
                                    {loading ? 'Signing in...' : 'SIGN IN'}
                                </button>
                            </form>
                        ) : (
                            <form className="auth-modal__form" onSubmit={handleRegister}>
                                <div className="auth-modal__field">
                                    <label htmlFor="signupName">Full Name</label>
                                    <input type="text" id="signupName" name="name" required placeholder="Your full name" />
                                </div>
                                <div className="auth-modal__field">
                                    <label htmlFor="signupEmail">Email</label>
                                    <input type="email" id="signupEmail" name="email" required placeholder="your@email.com" />
                                </div>
                                <div className="auth-modal__field">
                                    <label htmlFor="signupPassword">Password</label>
                                    <input type="password" id="signupPassword" name="password" required minLength={8} placeholder="Min 8 characters" />
                                </div>
                                <div className="auth-modal__field">
                                    <label htmlFor="signupConfirm">Confirm Password</label>
                                    <input type="password" id="signupConfirm" name="confirm" required minLength={8} placeholder="Confirm password" />
                                </div>
                                <button type="submit" className="btn btn--primary auth-modal__submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'CREATE ACCOUNT'}
                                </button>
                            </form>
                        )}

                        <div className="auth-modal__divider"><span>OR</span></div>
                        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                            <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }} />
                        ) : (
                            <button className="auth-modal__google" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.77.9 7.35 2.47 10.54l8.06-5.95z" /><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                                Google Sign-In (configure NEXT_PUBLIC_GOOGLE_CLIENT_ID)
                            </button>
                        )}

                        <div className="auth-modal__footer">
                            {activeTab === 'login' ? (
                                <span>Don&apos;t have an account? <button className="auth-modal__toggle" onClick={() => switchTab('signup')}>Sign Up</button></span>
                            ) : (
                                <span>Already have an account? <button className="auth-modal__toggle" onClick={() => switchTab('login')}>Login</button></span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
