'use client';

function normalizeApiBase(origin: string): string {
    const normalized = origin.trim().replace(/^"(.+)"$/, '$1').replace(/\/$/, '');
    if (/\/api\/v1$/i.test(normalized)) return normalized;
    if (/\/api$/i.test(normalized)) return `${normalized}/v1`;
    return `${normalized}/api/v1`;
}

const configuredApiOrigin = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/^"(.+)"$/, '$1').replace(/\/$/, '');
const configuredApiBase = configuredApiOrigin ? normalizeApiBase(configuredApiOrigin) : null;
const FALLBACK_PROD_API_BASE = 'https://feelinga-tea-api.onrender.com/api/v1';
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const GET_RETRY_COUNT = 4;
const RETRY_DELAY_MS = 1200;

function unique<T>(items: T[]): T[] {
    return Array.from(new Set(items));
}

function getApiBases(): string[] {
    const candidates: string[] = [];

    // Prefer same-origin proxy first in browsers to avoid CORS failures and double-request bursts.
    if (typeof window !== 'undefined') {
        candidates.push('/api/v1');
    }

    if (configuredApiBase) candidates.push(configuredApiBase);

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        const isDeployedFrontend = hostname === 'feelinga-tea.vercel.app' || hostname.endsWith('.vercel.app');
        if (isDeployedFrontend) candidates.push(FALLBACK_PROD_API_BASE);
    }

    // Server-side / non-browser fallback.
    if (typeof window === 'undefined') {
        candidates.push('/api/v1');
    }
    return unique(candidates);
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, method: string): Promise<Response> {
    const retries = method === 'GET' ? GET_RETRY_COUNT : 0;
    let attempt = 0;

    while (true) {
        try {
            const response = await fetch(url, init);
            if (attempt < retries && RETRYABLE_STATUS.has(response.status)) {
                attempt += 1;
                await wait(RETRY_DELAY_MS * attempt);
                continue;
            }
            return response;
        } catch (networkError) {
            if (attempt < retries) {
                attempt += 1;
                await wait(RETRY_DELAY_MS * attempt);
                continue;
            }
            throw new Error('Network error — please check your connection and try again.');
        }
    }
}

// Mutex: only one token refresh at a time to prevent race conditions
// (e.g. AuthContext + admin checkAuth both getting 401 simultaneously)
let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

async function doRefresh(apiBase: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    // Send stored refresh token in body as fallback alongside the httpOnly cookie
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('feelinga_refresh') : null;
    try {
        const res = await fetch(`${apiBase}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(refreshToken ? { refreshToken } : {}),
        });
        if (res.ok) {
            const data = await res.json();
            // ponytail: access token lives in httpOnly cookie set by server — do NOT
            // write it to localStorage (that makes it XSS-readable).
            // Only persist the refresh token (opaque, sent in POST body as fallback).
            if (data?.data?.refreshToken) {
                localStorage.setItem('feelinga_refresh', data.data.refreshToken);
            }
            return data.data;
        }
    } catch (err) {
        console.warn('[Auth] Token refresh failed:', err instanceof Error ? err.message : 'Network error');
    }
    // Refresh failed — clear dead tokens so login gate / AuthContext can react
    localStorage.removeItem('feelinga_refresh');
    localStorage.removeItem('feelinga_user');
    return null;
}

export async function apiRequest(path: string, options: any = {}) {
    // Access token lives in the httpOnly cookie set by the server (setAuthCookies).
    // We do NOT read it from localStorage — that would make it XSS-readable.
    // credentials: 'include' below carries the cookie on every request automatically.
    const method = String(options.method || 'GET').toUpperCase();

    const bases = getApiBases();
    let lastError: Error | null = null;

    for (let i = 0; i < bases.length; i += 1) {
        const base = bases[i];
        const url = `${base}${path}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        try {
            const requestInit = { ...options, headers, credentials: 'include' as const };
            let res = await fetchWithRetry(url, requestInit, method);

            // Auto-refresh on 401 (mutex prevents duplicate refresh calls)
            if (res.status === 401 && !path.startsWith('/auth/refresh')) {
                if (!refreshPromise) {
                    refreshPromise = doRefresh(base).finally(() => { refreshPromise = null; });
                }
                const tokens = await refreshPromise;
                if (tokens) {
                    // Server re-sets the access cookie on refresh — just retry the request
                    res = await fetchWithRetry(url, { ...options, headers, credentials: 'include' }, method);
                }
            }

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (RETRYABLE_STATUS.has(res.status) && i < bases.length - 1) {
                    continue;
                }
                if (RETRYABLE_STATUS.has(res.status)) {
                    throw new Error('Server is waking up. Please try again in a few seconds.');
                }
                throw new Error(data.message || `Request failed (${res.status})`);
            }

            return data;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error('Request failed');
            if (i < bases.length - 1) continue;
        }
    }

    throw lastError || new Error('Request failed');
}
