'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import type { AppProviderProps, AuthContextValue, UserProfile } from '../types/app';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AppProviderProps) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const clearAuthStorage = () => {
        localStorage.removeItem('feelinga_user');
        localStorage.removeItem('feelinga_token');
        localStorage.removeItem('feelinga_refresh');
        // Clear local cart to prevent stale basket data after logout/session expiry.
        localStorage.removeItem('feelinga_cart');
    };

    useEffect(() => {
        const stored = localStorage.getItem('feelinga_user');
        const token = localStorage.getItem('feelinga_token');
        if (stored && token) {
            // Hydrate immediately from localStorage for fast UI
            const u = JSON.parse(stored) as UserProfile;
            setUser(u);
            setIsAuthenticated(true);
            setIsAdmin(u.role === 'admin');

            // Validate token in background
            apiRequest('/auth/me').then(data => {
                const freshUser = data.data.user as UserProfile;
                localStorage.setItem('feelinga_user', JSON.stringify(freshUser));
                setUser(freshUser);
                setIsAdmin(freshUser.role === 'admin');
            }).catch(() => {
                // Token invalid — clear auth state
                clearAuthStorage();
                setUser(null);
                setIsAuthenticated(false);
                setIsAdmin(false);
            }).finally(() => setAuthReady(true));
        } else {
            setAuthReady(true);
        }
    }, []);

    const persist = (userData: UserProfile, accessToken: string, refreshToken: string) => {
        localStorage.setItem('feelinga_user', JSON.stringify(userData));
        localStorage.setItem('feelinga_token', accessToken);
        localStorage.setItem('feelinga_refresh', refreshToken);
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.role === 'admin');
    };

    const login = async (email: string, password: string) => {
        const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        if (data?.status === 'success' && data?.data?.accessToken && data?.data?.refreshToken && data?.data?.user) {
            persist(data.data.user, data.data.accessToken, data.data.refreshToken);
        }
        return data;
    };

    const register = async (name: string, email: string, password: string) => {
        const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
        persist(data.data.user, data.data.accessToken, data.data.refreshToken);
        return data;
    };

    const googleLogin = async (credential: string) => {
        const data = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
        if (data?.status === 'success' && data?.data?.accessToken && data?.data?.refreshToken && data?.data?.user) {
            persist(data.data.user, data.data.accessToken, data.data.refreshToken);
        }
        return data;
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem('feelinga_token');
            if (token) {
                await apiRequest('/auth/logout', { method: 'POST' });
            }
        } catch {
            // Even if server logout fails, always clear local auth state.
        } finally {
            clearAuthStorage();
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
        }
    };

    const updateProfile = async (updates: Record<string, unknown>) => {
        const data = await apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(updates) });
        const updated = { ...(user || {}), ...data.data.user } as UserProfile;
        localStorage.setItem('feelinga_user', JSON.stringify(updated));
        setUser(updated);
        return data;
    };

    const openAuthModal = () => setShowAuthModal(true);
    const closeAuthModal = () => setShowAuthModal(false);

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated, isAdmin, authReady, login, register, googleLogin, logout, updateProfile, showAuthModal, openAuthModal, closeAuthModal }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
