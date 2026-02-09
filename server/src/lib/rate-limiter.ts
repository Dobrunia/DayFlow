/**
 * Simple in-memory rate limiter
 * Limits requests per user/IP within a time window
 */

import type { RateLimitEntry, RateLimitConfig } from './types.js';

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  entry.count++;
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return { allowed, remaining, resetAt: entry.resetAt };
}

export class RateLimitError extends Error {
  code = 'RATE_LIMIT_EXCEEDED';
  constructor(message = 'Слишком много запросов. Подождите немного.') {
    super(message);
    this.name = 'RateLimitError';
  }
}
