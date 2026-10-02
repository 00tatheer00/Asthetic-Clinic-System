/**
 * Simple in-memory IP-based rate limiter for server actions.
 * Uses a Map with sliding window counters. Entries auto-expire.
 *
 * NOTE: This is per-instance (per serverless function invocation).
 * For distributed rate limiting across multiple instances, use
 * Upstash Redis or similar. This provides basic bot protection.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request should be rate-limited.
 *
 * @param key - Unique identifier (typically IP + action name)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { limited: boolean, remaining: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { limited: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — reset counter
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { limited: true, remaining: 0 };
  }

  entry.count += 1;
  return { limited: false, remaining: maxRequests - entry.count };
}

/**
 * Get client IP from Next.js headers.
 * Works with Vercel (x-forwarded-for) and direct connections.
 */
export async function getClientIp(): Promise<string> {
  try {
    const { headers } = await import('next/headers');
    const headerStore = await headers();
    return (
      headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headerStore.get('x-real-ip') ||
      'unknown'
    );
  } catch {
    return 'unknown';
  }
}
