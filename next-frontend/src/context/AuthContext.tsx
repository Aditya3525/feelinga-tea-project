'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('feelinga_user');
        if (stored) {
            const u = JSON.parse(stored);
            setUser(u);
            setIsAuthenticated(true);
            setIsAdmin(u.role === 'admin');
        }
    }, []);

    const persist = (userData, accessToken, refreshToken) => {
        localStorage.setItem('feelinga_user', JSON.stringify(userData));
        localStorage.setItem('feelinga_token', accessToken);
        localStorage.setItem('feelinga_refresh', refreshToken);
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.role === 'admin');
    };

    const login = async (email, password) => {
        const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        persist(data.data.user, data.data.accessToken, data.data.refreshToken);
        return data;
    };

    const register = async (name, email, password) => {
        const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
        persist(data.data.user, data.data.accessToken, data.data.refreshToken);
        return data;
    };

    const googleLogin = async (credential) => {
        const data = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
        persist(data.data.user, data.data.accessToken, data.data.refreshToken);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('feelinga_user');
        localStorage.removeItem('feelinga_token');
        localStorage.removeItem('feelinga_refresh');
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
    };

    const updateProfile = async (updates) => {
        const data = await apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(updates) });
        const updated = { ...user, ...data.data.user };
        localStorage.setItem('feelinga_user', JSON.stringify(updated));
        setUser(updated);
        return data;
    };

    const openAuthModal = () => setShowAuthModal(true);
    const closeAuthModal = () => setShowAuthModal(false);

    return (
        <AuthContext.Provider value={{ user, setUser, isAuthenticated, isAdmin, login, register, googleLogin, logout, updateProfile, showAuthModal, openAuthModal, closeAuthModal }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() { return useContext(AuthContext); }
