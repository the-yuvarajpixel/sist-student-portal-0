import crypto from 'node:crypto';

interface CacheEntry<T> {
  data: T;
  fetchedAt: string;
  expiresAt: number;
}

export interface CacheFetchResult<T> {
  data: T;
  stale: boolean;
  fetchedAt: string;
  warning?: string;
}

export interface CacheStats {
  entries: number;
  diskBacked: boolean;
}

const MAX_CACHE_ENTRIES = 2048;

/**
 * Per-user section cache with TTL expiration and stale-while-error fallback.
 * Keys are strictly scoped by a SHA-256 user hash so logout purges all entries for a user.
 */
export class TwoTierCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  static hashUserKey(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').slice(0, 32);
  }

  private keyFor(userHash: string, sectionKey: string): string {
    return `${userHash}:${sectionKey}`;
  }

  stats(): CacheStats {
    return {
      entries: this.store.size,
      diskBacked: false,
    };
  }

  clearUser(userHash: string): void {
    const prefix = `${userHash}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async getOrFetch<T>(
    userHash: string,
    sectionKey: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
    options?: { forceRefresh?: boolean }
  ): Promise<CacheFetchResult<T>> {
    const key = this.keyFor(userHash, sectionKey);
    const now = Date.now();
    const existing = this.store.get(key) as CacheEntry<T> | undefined;

    if (existing && !options?.forceRefresh && now < existing.expiresAt) {
      return {
        data: existing.data,
        stale: false,
        fetchedAt: existing.fetchedAt,
      };
    }

    try {
      const freshData = await fetcher();
      const fetchedAt = new Date().toISOString();
      if (this.store.size >= MAX_CACHE_ENTRIES && !this.store.has(key)) {
        const oldestKey = this.store.keys().next().value;
        if (oldestKey !== undefined) {
          this.store.delete(oldestKey);
        }
      }
      this.store.set(key, {
        data: freshData,
        fetchedAt,
        expiresAt: now + Math.max(1000, ttlMs),
      });
      return {
        data: freshData,
        stale: false,
        fetchedAt,
      };
    } catch (err) {
      if (existing) {
        const reason =
          err instanceof Error && err.message
            ? err.message
            : 'Upstream source temporarily unavailable';
        return {
          data: existing.data,
          stale: true,
          fetchedAt: existing.fetchedAt,
          warning: `Showing cached snapshot — ${reason}.`,
        };
      }
      throw err;
    }
  }
}
