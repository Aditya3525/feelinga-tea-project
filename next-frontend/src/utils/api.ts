'use client';

const API_BASE = '/api/v1';

// Mutex: only one token refresh at a time to prevent race conditions
// (e.g. AuthContext + admin checkAuth both getting 401 simultaneously)
let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

async function doRefresh(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const refreshToken = localStorage.getItem('feelinga_refresh');
    if (!refreshToken) return null;
    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('feelinga_token', data.data.accessToken);
            localStorage.setItem('feelinga_refresh', data.data.refreshToken);
            return data.data;
        }
    } catch (err) {
        console.warn('[Auth] Token refresh failed:', err instanceof Error ? err.message : 'Network error');
    }
    // Refresh failed — clear dead tokens so login gate / AuthContext can react
    localStorage.removeItem('feelinga_token');
    localStorage.removeItem('feelinga_refresh');
    localStorage.removeItem('feelinga_user');
    return null;
}

export async function apiRequest(path: string, options: any = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('feelinga_token') : null;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (networkError) {
        throw new Error('Network error — please check your connection and try again.');
    }

    // Auto-refresh on 401 (mutex prevents duplicate refresh calls)
    if (res.status === 401 && token) {
        if (!refreshPromise) {
            refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
        }
        const tokens = await refreshPromise;
        if (tokens) {
            headers.Authorization = `Bearer ${tokens.accessToken}`;
            try {
                res = await fetch(`${API_BASE}${path}`, { ...options, headers });
            } catch (networkError) {
                throw new Error('Network error — please check your connection and try again.');
            }
        }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
}
