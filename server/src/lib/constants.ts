/**
 * Server-wide constants and limits
 */

// Field length limits
export const MAX_TITLE_LENGTH = 191; // MySQL VARCHAR limit

// Entity limits
export const MAX_COLUMNS_PER_WORKSPACE = 20;
export const MAX_CARDS_PER_USER = 500;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window
