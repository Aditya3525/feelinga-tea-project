import jwt from 'jsonwebtoken';
import type { CookieOptions, Request, Response } from 'express';

export const ACCESS_COOKIE_NAME = 'feelinga_access';
export const REFRESH_COOKIE_NAME = 'feelinga_refresh';

function resolveSameSite(): 'lax' | 'strict' | 'none' {
    const configured = String(process.env.COOKIE_SAMESITE || '').trim().toLowerCase();
    if (configured === 'lax' || configured === 'strict' || configured === 'none') return configured;
    return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
}

function tokenMaxAge(token: string): number | undefined {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return undefined;
    const ms = decoded.exp * 1000 - Date.now();
    return ms > 0 ? ms : undefined;
}

function baseCookieOptions(): CookieOptions {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
    const sameSite = resolveSameSite();
    const options: CookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite,
        path: '/',
    };
    if (cookieDomain) options.domain = cookieDomain;
    return options;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const base = baseCookieOptions();
    res.cookie(ACCESS_COOKIE_NAME, accessToken, { ...base, maxAge: tokenMaxAge(accessToken) });
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, { ...base, maxAge: tokenMaxAge(refreshToken) });
}

export function clearAuthCookies(res: Response) {
    const base = baseCookieOptions();
    res.clearCookie(ACCESS_COOKIE_NAME, base);
    res.clearCookie(REFRESH_COOKIE_NAME, base);
}

export function getCookieValue(req: Request, name: string): string | null {
    const raw = req.headers.cookie;
    if (!raw) return null;
    const pairs = raw.split(';');
    for (const pair of pairs) {
        const [k, ...rest] = pair.trim().split('=');
        if (k === name) return decodeURIComponent(rest.join('='));
    }
    return null;
}
