import crypto from 'crypto';
import logger from './logger.js';
import { AppError } from '../middleware/errorHandler.js';

type CacheEntry = {
    expiresAt: number;
    body: string;
};

const rangeCache = new Map<string, CacheEntry>();

function getBooleanEnv(name: string, fallback: boolean): boolean {
    const raw = process.env[name];
    if (raw == null) return fallback;
    return raw.trim().toLowerCase() === 'true';
}

function getNumberEnv(name: string, fallback: number): number {
    const raw = Number.parseInt(String(process.env[name] || ''), 10);
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

async function fetchRange(prefix: string): Promise<string> {
    const now = Date.now();
    const cached = rangeCache.get(prefix);
    if (cached && cached.expiresAt > now) return cached.body;

    const timeoutMs = getNumberEnv('HIBP_TIMEOUT_MS', 4000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            method: 'GET',
            headers: {
                'User-Agent': process.env.HIBP_USER_AGENT || 'Feelinga-Security-Check',
                'Add-Padding': 'true',
            },
            signal: controller.signal,
        });
        if (!res.ok) {
            throw new Error(`HIBP range query failed (${res.status})`);
        }
        const body = await res.text();
        const cacheTtlMs = getNumberEnv('HIBP_CACHE_TTL_MS', 6 * 60 * 60 * 1000);
        rangeCache.set(prefix, { body, expiresAt: now + cacheTtlMs });
        return body;
    } finally {
        clearTimeout(timeout);
    }
}

function extractPwnCount(rangeBody: string, suffix: string): number {
    const lines = rangeBody.split('\n');
    for (const line of lines) {
        const [candidateSuffix, countRaw] = line.trim().split(':');
        if (candidateSuffix?.toUpperCase() !== suffix) continue;
        const count = Number.parseInt(String(countRaw || ''), 10);
        return Number.isFinite(count) ? count : 0;
    }
    return 0;
}

export async function assertPasswordNotBreached(password: string) {
    const enabled = getBooleanEnv('HIBP_ENFORCE', false);
    if (!enabled) return;

    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const minCount = getNumberEnv('HIBP_MIN_BREACH_COUNT', 1);
    const failClosed = getBooleanEnv('HIBP_FAIL_CLOSED', false);

    try {
        const body = await fetchRange(prefix);
        const pwnCount = extractPwnCount(body, suffix);
        if (pwnCount >= minCount) {
            throw new AppError('This password has appeared in known data breaches. Please choose a different password.', 400);
        }
    } catch (err) {
        if (err instanceof AppError) throw err;
        logger.warn({ err }, 'HIBP password breach check failed');
        if (failClosed) {
            throw new AppError('Unable to validate password safety right now. Please try again.', 503);
        }
    }
}
