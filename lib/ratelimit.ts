/**
 * Rate Limiting Utility
 *
 * Implements token bucket algorithm for rate limiting.
 * Uses in-memory storage (suitable for single-instance deployments).
 *
 * For production multi-instance deployments, consider using:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel Edge Config
 * - Redis/Memcached
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Optional: Custom identifier (defaults to IP address)
   */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const existing = store.get(key);

  // No existing entry or window has expired - allow request
  if (!existing || existing.resetTime < now) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: now + windowMs,
    };
  }

  // Check if limit exceeded
  if (existing.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: existing.resetTime,
    };
  }

  // Increment count and allow request
  existing.count++;

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - existing.count,
    reset: existing.resetTime,
  };
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  // Check various headers for real IP (considering proxies)
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare

  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0].trim() || 'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // Strict limits for expensive operations
  SONG_CREATION: {
    maxRequests: 5,
    windowSeconds: 60, // 5 songs per minute
  },

  // Moderate limits for API calls
  API_DEFAULT: {
    maxRequests: 30,
    windowSeconds: 60, // 30 requests per minute
  },

  // Relaxed limits for reads
  API_READ: {
    maxRequests: 60,
    windowSeconds: 60, // 60 requests per minute
  },

  // Very strict for webhooks to prevent abuse
  WEBHOOK: {
    maxRequests: 10,
    windowSeconds: 60, // 10 callbacks per minute
  },

  // Proxy limits to prevent bandwidth abuse
  PROXY: {
    maxRequests: 20,
    windowSeconds: 60, // 20 audio fetches per minute
  },
} as const;
