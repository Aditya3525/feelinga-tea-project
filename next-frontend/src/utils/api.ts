'use client';

const API_BASE = '/api/v1';

export async function apiRequest(path, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('feelinga_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // Auto-refresh on 401
    if (res.status === 401 && token) {
        const refreshToken = localStorage.getItem('feelinga_refresh');
        if (refreshToken) {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                localStorage.setItem('feelinga_token', data.data.accessToken);
                localStorage.setItem('feelinga_refresh', data.data.refreshToken);
                headers.Authorization = `Bearer ${data.data.accessToken}`;
                res = await fetch(`${API_BASE}${path}`, { ...options, headers });
            }
        }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}
