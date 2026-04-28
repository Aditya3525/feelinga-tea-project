import dns from 'node:dns/promises';
import { domainToASCII } from 'node:url';
import { createRequire } from 'node:module';
import logger from './logger.js';

const require = createRequire(import.meta.url);
const disposableDomains = new Set<string>(require('disposable-email-domains'));
const disposableWildcards = require('disposable-email-domains/wildcard.json') as string[];

const EMAIL_REGEX = /^(?=.{1,254}$)(?=.{1,64}@)(?!.*\.\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export type EmailCheckResult = {
    email: string;
    normalizedEmail: string;
    syntaxValid: boolean;
    domainExists: boolean;
    hasMx: boolean;
    hasA: boolean;
    disposable: boolean;
    externalProvider: 'none' | 'hunter';
    externalStatus: string | null;
    externalResult: string | null;
    gibberish: boolean;
    valid: boolean;
    reason: string | null;
};

type HunterVerification = {
    provider: 'hunter';
    status: string;
    result: string | null;
    gibberish: boolean;
};

function normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
}

function extractDomain(email: string): string {
    const atIndex = email.lastIndexOf('@');
    return atIndex === -1 ? '' : email.slice(atIndex + 1);
}

function isValidDomainShape(domain: string): boolean {
    if (!domain || domain.startsWith('-') || domain.endsWith('-') || domain.includes('..')) return false;
    const labels = domain.split('.');
    if (labels.length < 2) return false;
    return labels.every((label, index) => {
        if (!label || label.length > 63) return false;
        if (index === labels.length - 1 && label.length < 2) return false;
        return /^[A-Za-z0-9-]+$/.test(label) && !label.startsWith('-') && !label.endsWith('-');
    });
}

function isDisposableDomain(domain: string): boolean {
    if (!domain) return false;
    if (disposableDomains.has(domain)) return true;
    return disposableWildcards.some((wildcard) => {
        const suffix = wildcard.replace(/^\*\./, '');
        return suffix.length > 0 && domain !== suffix && domain.endsWith(`.${suffix}`);
    });
}

async function checkDomain(domain: string): Promise<{ domainExists: boolean; hasMx: boolean; hasA: boolean }> {
    const asciiDomain = domainToASCII(domain.trim());
    if (!asciiDomain) {
        return { domainExists: false, hasMx: false, hasA: false };
    }

    try {
        const mxRecords = await dns.resolveMx(asciiDomain);
        if (mxRecords.length > 0) {
            return { domainExists: true, hasMx: true, hasA: false };
        }
    } catch {
        // Fall through to A/AAAA lookup.
    }

    try {
        await dns.lookup(asciiDomain, { all: true });
        return { domainExists: true, hasMx: false, hasA: true };
    } catch {
        return { domainExists: false, hasMx: false, hasA: false };
    }
}

function getBooleanEnv(name: string, fallback: boolean): boolean {
    const raw = process.env[name];
    if (raw == null) return fallback;
    return raw.trim().toLowerCase() === 'true';
}

function getNumberEnv(name: string, fallback: number): number {
    const parsed = Number.parseInt(String(process.env[name] || ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function verifyWithHunter(email: string): Promise<HunterVerification | null> {
    const provider = String(process.env.EMAIL_VERIFIER_PROVIDER || '').trim().toLowerCase();
    const apiKey = String(process.env.HUNTER_API_KEY || '').trim();
    if (provider !== 'hunter' || !apiKey) return null;

    const timeoutMs = getNumberEnv('HUNTER_TIMEOUT_MS', 8000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const url = new URL('https://api.hunter.io/v2/email-verifier');
        url.searchParams.set('email', email);
        url.searchParams.set('api_key', apiKey);

        const response = await fetch(url.toString(), {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': process.env.HUNTER_USER_AGENT || 'Feelinga-Email-Verification',
            },
        });

        if (response.status === 202) {
            return {
                provider: 'hunter',
                status: 'unknown',
                result: 'risky',
                gibberish: false,
            };
        }

        if (!response.ok) {
            throw new Error(`Hunter API returned ${response.status}`);
        }

        const body = await response.json() as any;
        const data = body?.data || {};
        return {
            provider: 'hunter',
            status: String(data.status || 'unknown').toLowerCase(),
            result: data.result ? String(data.result).toLowerCase() : null,
            gibberish: Boolean(data.gibberish),
        };
    } finally {
        clearTimeout(timeout);
    }
}

export async function checkEmailAddress(email: string): Promise<EmailCheckResult> {
    const normalizedEmail = normalizeEmail(email);
    const syntaxValid = EMAIL_REGEX.test(normalizedEmail) && normalizedEmail.length <= 254;
    if (!syntaxValid) {
        return {
            email: String(email || '').trim(),
            normalizedEmail,
            syntaxValid: false,
            domainExists: false,
            hasMx: false,
            hasA: false,
            disposable: false,
            externalProvider: 'none',
            externalStatus: null,
            externalResult: null,
            gibberish: false,
            valid: false,
            reason: 'Please enter a valid email address.',
        };
    }

    const domain = extractDomain(normalizedEmail);
    if (!domain || !isValidDomainShape(domain)) {
        return {
            email: String(email || '').trim(),
            normalizedEmail,
            syntaxValid: true,
            domainExists: false,
            hasMx: false,
            hasA: false,
            disposable: false,
            externalProvider: 'none',
            externalStatus: null,
            externalResult: null,
            gibberish: false,
            valid: false,
            reason: 'Please enter a valid email address.',
        };
    }

    const [domainChecks, disposable] = await Promise.all([
        checkDomain(domain),
        Promise.resolve(isDisposableDomain(domain)),
    ]);

    let valid = domainChecks.domainExists && !disposable;
    let reason: string | null = null;
    let externalProvider: 'none' | 'hunter' = 'none';
    let externalStatus: string | null = null;
    let externalResult: string | null = null;
    let gibberish = false;

    if (!domainChecks.domainExists) {
        reason = 'The email domain does not exist or has no mail records.';
    } else if (disposable) {
        reason = 'Disposable email addresses are not allowed.';
    }

    if (valid) {
        try {
            const hunter = await verifyWithHunter(normalizedEmail);
            if (hunter) {
                externalProvider = hunter.provider;
                externalStatus = hunter.status;
                externalResult = hunter.result;
                gibberish = hunter.gibberish;

                const rejectUnknown = getBooleanEnv('HUNTER_REJECT_UNKNOWN', false);
                const rejectGibberish = getBooleanEnv('HUNTER_REJECT_GIBBERISH', true);

                const isHardInvalid = hunter.status === 'invalid'
                    || hunter.status === 'disposable'
                    || hunter.result === 'undeliverable';
                const isUnknown = hunter.status === 'unknown' || hunter.result === 'risky';

                if (isHardInvalid) {
                    valid = false;
                    reason = 'This email address appears undeliverable.';
                } else if (rejectGibberish && hunter.gibberish) {
                    valid = false;
                    reason = 'This email address looks auto-generated. Please use your real email address.';
                } else if (rejectUnknown && isUnknown) {
                    valid = false;
                    reason = 'We could not verify this email address. Please use another email.';
                }
            }
        } catch (err) {
            logger.warn({ err }, 'External email verification failed');
            const failOpen = getBooleanEnv('HUNTER_FAIL_OPEN', true);
            if (!failOpen) {
                valid = false;
                reason = 'Email verification service is unavailable. Please try again shortly.';
            }
        }
    }

    return {
        email: String(email || '').trim(),
        normalizedEmail,
        syntaxValid: true,
        domainExists: domainChecks.domainExists,
        hasMx: domainChecks.hasMx,
        hasA: domainChecks.hasA,
        disposable,
        externalProvider,
        externalStatus,
        externalResult,
        gibberish,
        valid,
        reason,
    };
}
