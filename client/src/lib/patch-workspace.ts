/**
 * Smart workspace patching utility.
 *
 * Instead of replacing `currentWorkspace` wholesale (which causes every
 * component to re-render), this utility diffs the incoming server snapshot
 * against the current local state and mutates only the properties that
 * actually changed. Vue's reactivity then fires only for touched paths.
 */

import type { Workspace, Column, Tool, CardGql } from '@/graphql/types';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Deep-clone a value. Used to avoid assigning frozen Apollo objects into mutable state. */
const clone = <T>(v: T): T => structuredClone(v);

/** Shallow-compare two values (handles primitives, null, arrays of primitives). */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  return false;
}

/** Patch scalar fields from `remote` onto `local` in-place. */
function patchScalars(local: any, remote: any, fields: readonly string[]): void {
  for (const key of fields) {
    if (!same(local[key], remote[key])) {
      local[key] = remote[key];
    }
  }
}

/**
 * Sort `local` array in-place to match `remote` id order.
 * Only sorts when the ids are the same set but in different order.
 */
function alignOrder<T extends { id: string }>(local: T[], remote: T[]): void {
  if (local.length !== remote.length) return;
  const remoteIds = remote.map((r) => r.id);
  const needsSort = local.some((item, i) => item.id !== remoteIds[i]);
  if (!needsSort) return;
  const idxMap = new Map(remoteIds.map((id, i) => [id, i]));
  local.sort((a, b) => (idxMap.get(a.id) ?? 0) - (idxMap.get(b.id) ?? 0));
}

/**
 * Generic reconcile: remove items not in remote, patch existing via callback,
 * insert new items, then fix order.
 */
function reconcileById<T extends { id: string }>(
  local: T[],
  remote: T[],
  patchItem: (l: T, r: T) => void,
): void {
  const remoteMap = new Map(remote.map((r) => [r.id, r]));
  const localMap = new Map(local.map((l) => [l.id, l]));

  // Remove items not in remote
  for (let i = local.length - 1; i >= 0; i--) {
    if (!remoteMap.has(local[i].id)) local.splice(i, 1);
  }

  // Patch existing & collect new
  const toInsert: { index: number; item: T }[] = [];
  for (let i = 0; i < remote.length; i++) {
    const r = remote[i];
    const l = localMap.get(r.id);
    if (l) {
      patchItem(l, r);
    } else {
      toInsert.push({ index: i, item: r });
    }
  }

  for (const { index, item } of toInsert) {
    local.splice(index, 0, clone(item));
  }

  alignOrder(local, remote);
}

// ─── field lists ────────────────────────────────────────────────────────────

const CARD_FIELDS = [
  'title', 'done', 'payload', 'type', 'order',
  'learningStatus', 'columnId', 'workspaceId', 'ownerId',
  'createdAt', 'updatedAt',
] as const;

const WS_FIELDS = [
  'title', 'description', 'icon', 'inviteToken',
  'editingBy', 'createdAt', 'updatedAt', 'pinned',
] as const;

const COLUMN_FIELDS = ['title', 'order', 'hideCompleted', 'color'] as const;

const TOOL_FIELDS = [
  'title', 'link', 'description', 'icon',
  'ownerId', 'workspaceId', 'createdAt', 'updatedAt',
] as const;

// ─── item patchers ──────────────────────────────────────────────────────────

function patchCard(local: CardGql, remote: CardGql): void {
  patchScalars(local, remote, CARD_FIELDS);
  if (!same(local.tags, remote.tags)) local.tags = [...remote.tags];
}

function patchColumn(local: Column, remote: Column): void {
  patchScalars(local, remote, COLUMN_FIELDS);
  if (remote.cards && local.cards) {
    reconcileById(local.cards, remote.cards, patchCard);
  } else if (remote.cards) {
    (local as any).cards = clone(remote.cards);
  }
}

function patchTool(local: Tool, remote: Tool): void {
  patchScalars(local, remote, TOOL_FIELDS);
  if (!same(local.tags, remote.tags)) local.tags = [...remote.tags];
}

// ─── sub-object patchers ────────────────────────────────────────────────────

function patchEditingUser(local: any, remote: any): void {
  const le = local.editingUser;
  const re = remote.editingUser;
  if (le?.id !== re?.id || le?.email !== re?.email || le?.avatarUrl !== re?.avatarUrl) {
    local.editingUser = re ? { ...re } : re;
  }
}

function patchOwner(local: any, remote: any): void {
  if (local.owner?.id !== remote.owner?.id) {
    local.owner = remote.owner ? { ...remote.owner } : remote.owner;
  }
}

const MEMBER_FIELDS = ['userId', 'joinedAt'] as const;

function patchMember(local: any, remote: any): void {
  patchScalars(local, remote, MEMBER_FIELDS);
  const lu = local.user;
  const ru = remote.user;
  if (lu?.id !== ru?.id || lu?.email !== ru?.email || lu?.avatarUrl !== ru?.avatarUrl) {
    local.user = ru ? { ...ru } : ru;
  }
}

function patchMembers(local: any, remote: any): void {
  if (remote.members && local.members) {
    reconcileById(local.members, remote.members, patchMember);
  } else if (remote.members) {
    local.members = clone(remote.members);
  }
}

/** Reconcile a named array field (columns / backlog / tools). */
function patchList<T extends { id: string }>(
  local: any, remote: any, key: string,
  patcher: (l: T, r: T) => void,
): void {
  if (remote[key] && local[key]) {
    reconcileById(local[key], remote[key], patcher);
  } else if (remote[key]) {
    local[key] = clone(remote[key]);
  }
}

// ─── main entry ─────────────────────────────────────────────────────────────

/**
 * Patch `local` workspace in-place with data from `remote`.
 * Only mutates fields/items that actually differ.
 * Vue's reactivity will only fire for touched properties.
 */
export function patchWorkspace(local: Workspace, remote: Workspace): void {
  patchScalars(local, remote, WS_FIELDS);
  patchEditingUser(local, remote);
  patchOwner(local, remote);
  patchMembers(local, remote);
  patchList<Column>(local, remote, 'columns', patchColumn);
  patchList<CardGql>(local, remote, 'backlog', patchCard);
  patchList<Tool>(local, remote, 'tools', patchTool);
}
