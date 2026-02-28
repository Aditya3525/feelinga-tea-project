/**
 * Simple in-memory cache with TTL.
 * Used for caching product listings and dashboard stats.
 */

interface CacheEntry<T = any> {
    data: T;
    expiresAt: number;
}

class MemoryCache {
    private store = new Map<string, CacheEntry>();
    private cleanupInterval: ReturnType<typeof setInterval>;

    constructor() {
        // Evict expired entries every 60s
        this.cleanupInterval = setInterval(() => this.evictExpired(), 60_000);
        // Allow process to exit even with this interval running
        if (this.cleanupInterval.unref) this.cleanupInterval.unref();
    }

    get<T = any>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    set<T = any>(key: string, data: T, ttlMs: number): void {
        this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
    }

    /** Delete a specific key */
    del(key: string): void {
        this.store.delete(key);
    }

    /** Delete all keys matching a prefix */
    invalidate(prefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }

    /** Flush entire cache */
    flush(): void {
        this.store.clear();
    }

    private evictExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}

export const cache = new MemoryCache();

// TTL constants (in milliseconds)
export const TTL = {
    PRODUCTS_LIST: 60_000,      // 1 min
    PRODUCT_DETAIL: 120_000,    // 2 min
    DASHBOARD: 300_000,         // 5 min
} as const;
