/**
 * A tiny TTL cache plus a request coalescer, used by the API routes.
 *
 * Why this exists: a lesson page can mount six live-quote widgets at once. Six
 * widgets must not become six upstream calls — that is how you get rate-limited
 * and how a classroom of thirty learners takes the data source down. Every
 * cache miss is coalesced so N concurrent callers for the same key produce
 * exactly one upstream fetch.
 *
 * Deliberately in-memory: this runs per server instance and the data is public
 * and cheap to refetch. Nothing here is worth a Redis dependency yet.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<T> {
  private store = new Map<string, Entry<T>>();
  private inflight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
  ) {}

  get(key: string, now = Date.now()): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= now) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T, now = Date.now()): void {
    if (this.store.size >= this.maxEntries) {
      // Cheapest possible eviction: drop the oldest insertion. Map preserves
      // insertion order, and this cache holds small, uniform entries.
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: now + this.ttlMs });
  }

  /**
   * Cached read-through with coalescing. Concurrent callers for the same key
   * share one in-flight promise.
   */
  async fetch(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const existing = this.inflight.get(key);
    if (existing) return existing;

    const p = loader()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, p);
    return p;
  }

  clear(): void {
    this.store.clear();
    this.inflight.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/**
 * Fixed-window rate limiter, applied per client IP in the API routes.
 *
 * A learner hammering refresh should degrade to a 429 with a clear message
 * rather than getting the whole deployment blocked upstream.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): { allowed: boolean; remaining: number; resetAt: number } {
    const cur = this.hits.get(key);
    if (!cur || cur.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.hits.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.limit - 1, resetAt };
    }
    cur.count += 1;
    return {
      allowed: cur.count <= this.limit,
      remaining: Math.max(0, this.limit - cur.count),
      resetAt: cur.resetAt,
    };
  }
}
