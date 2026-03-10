// Simple in-memory rate limiter — resets on server restart.
// Good enough for single-instance deployments.

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

/**
 * @param key     Unique key (e.g. "login:1.2.3.4")
 * @param limit   Max requests per window
 * @param windowMs Window size in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    store.set(key, bucket);
    return true;
  }

  bucket.count++;
  if (bucket.count > limit) return false;
  return true;
}

// Periodically clean up expired buckets to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store.entries()) {
    if (now >= bucket.resetAt) store.delete(key);
  }
}, 60_000);
