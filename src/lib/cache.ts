import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

// Read-through cache on Upstash Redis. Credentials come from .env
// (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN); without them every call
// goes straight to the database. Redis errors never break a request — they
// fall back to the database too.
//
// Invalidation uses a per-user generation number for each namespace. Every
// cache key embeds the current generation; a write bumps it, so all older
// entries stop being read at once and expire on their own. Unlike deleting
// keys, this can't be undone by a slow reader writing a stale value back
// after the change: that value lands under the old generation nobody reads.

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// Bump when the shape of cached values changes, so old entries are ignored
const VERSION = "v1";

/** Upper bound on staleness if an invalidation is ever missed */
const DEFAULT_TTL_SECONDS = 10 * 60;

// Only slow-changing data is cached. Transactions and notifications always
// come straight from the database so balances are never stale.
export type CacheNamespace = "books" | "platforms";

const ALL_NAMESPACES: CacheNamespace[] = ["books", "platforms"];

// Generation keys never expire: if one reset to 0, entries written under an
// earlier 0 could be served again.
const generationKey = (ns: CacheNamespace, userId: string) =>
  `${VERSION}:gen:${ns}:${userId}`;

const hashParts = (parts: unknown) =>
  createHash("sha1")
    .update(JSON.stringify(parts ?? null))
    .digest("base64url")
    .slice(0, 16);

/**
 * Returns the cached value for this user/namespace/parts, or runs `load` and
 * caches its result. `parts` must be built with a stable key order.
 */
export async function cached<T>(
  ns: CacheNamespace,
  userId: string,
  parts: unknown,
  load: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<T> {
  if (!redis) return load();

  let key: string | null = null;
  try {
    const generation = (await redis.get<number>(generationKey(ns, userId))) ?? 0;
    key = `${VERSION}:${ns}:${userId}:g${generation}:${hashParts(parts)}`;
    const hit = await redis.get<T>(key);
    if (hit !== null) return hit;
  } catch (error) {
    console.error(`Cache read failed for ${ns}:`, error);
  }

  // Only successful loads reach here; a throwing load is never cached
  const value = await load();
  if (key) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.error(`Cache write failed for ${ns}:`, error);
    }
  }
  return value;
}

/** Makes every cached entry in these namespaces stale for this user. Call after the write commits. */
export async function invalidate(
  ns: CacheNamespace | CacheNamespace[],
  userId: string,
) {
  if (!redis) return;
  const namespaces = Array.isArray(ns) ? ns : [ns];
  try {
    const pipeline = redis.pipeline();
    for (const name of namespaces) pipeline.incr(generationKey(name, userId));
    await pipeline.exec();
  } catch (error) {
    // A failed bump leaves stale data for at most the TTL
    console.error("Cache invalidation failed:", error);
  }
}

export const invalidateUser = (userId: string) =>
  invalidate(ALL_NAMESPACES, userId);
