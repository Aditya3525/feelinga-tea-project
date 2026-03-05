/**
 * Simple in-memory cache with TTL.
 * Used for caching product listings and dashboard stats.
 */
class MemoryCache {
    store = new Map();
    cleanupInterval;
    constructor() {
        // Evict expired entries every 60s
        this.cleanupInterval = setInterval(() => this.evictExpired(), 60_000);
        // Allow process to exit even with this interval running
        if (this.cleanupInterval.unref)
            this.cleanupInterval.unref();
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data, ttlMs) {
        this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
    }
    /** Delete a specific key */
    del(key) {
        this.store.delete(key);
    }
    /** Delete all keys matching a prefix */
    invalidate(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
    /** Flush entire cache */
    flush() {
        this.store.clear();
    }
    evictExpired() {
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
    PRODUCTS_LIST: 60_000, // 1 min
    PRODUCT_DETAIL: 120_000, // 2 min
    DASHBOARD: 300_000, // 5 min
};
