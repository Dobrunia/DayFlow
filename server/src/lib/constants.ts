/**
 * Server-wide constants and limits
 */

import { LIMITS } from 'dayflow-shared';

// Session
export const SESSION_EXPIRY_DAYS = 30;

// Field length limits
export const MAX_TITLE_LENGTH = LIMITS.MAX_TITLE_LENGTH;

// Entity limits
export const MAX_WORKSPACES_PER_USER = LIMITS.MAX_WORKSPACES_PER_USER;
export const MAX_CARDS_PER_USER = LIMITS.MAX_CARDS_PER_USER;
export const MAX_TOOLS_PER_WORKSPACE = LIMITS.MAX_TOOLS_PER_WORKSPACE;
export const MAX_COLUMNS_PER_WORKSPACE = LIMITS.MAX_COLUMNS_PER_WORKSPACE;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window
