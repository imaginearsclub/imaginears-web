import "server-only";

/**
 * Simple in-memory cache with TTL support.
 * For production, replace with Redis or similar persistent cache.
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton cache instance
const cache = new MemoryCache();

// Cleanup on process exit
if (typeof process !== "undefined" && process.on) {
  process.on("beforeExit", () => cache.destroy());
  process.on("SIGINT", () => cache.destroy());
  process.on("SIGTERM", () => cache.destroy());
}

export { cache };

/**
 * Cache key generators for consistent naming
 */
export const cacheKeys = {
  events: (limit: number) => `events:${limit}`,
  settings: () => "settings:global",
  applications: (status?: string) => `applications:${status || "all"}`,
  user: (id: string) => `user:${id}`,
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const cacheTTL = {
  events: 300, // 5 minutes
  settings: 600, // 10 minutes
  applications: 180, // 3 minutes
  user: 900, // 15 minutes
} as const;
