import type { PrismaClient, User, Workspace, Column, Card } from '@prisma/client';
import type DataLoader from 'dataloader';

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
}

// ── Context ───────────────────────────────────────────────────────────────────

export interface Context {
  prisma: PrismaClient;
  user: SessionUser | null;
  sessionToken: string | null;
  ip: string;
  loaders: DataLoaders;
}

// ── DataLoaders ───────────────────────────────────────────────────────────────

export interface DataLoaders {
  userById: DataLoader<string, User | null>;
  workspaceById: DataLoader<string, Workspace | null>;
  columnsByWorkspaceId: DataLoader<string, Column[]>;
  cardsByColumnId: DataLoader<string, Card[]>;
  cardsByWorkspaceId: DataLoader<string, Card[]>;
}

// ── Rate limiter ──────────────────────────────────────────────────────────────

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}
