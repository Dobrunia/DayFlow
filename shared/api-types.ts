/**
 * Типы, соответствующие GraphQL API (ответы и инпуты).
 */
import type { CardType } from "./card.js";

/** Карточка как приходит с API: type в верхнем регистре, payload — JSON-строка */
export interface CardGql {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  workspaceId: string | null;
  columnId: string | null;
  order: number | null;
  type: Uppercase<CardType>;
  title: string | null;
  done: boolean;
  payload: string;
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  cards?: CardGql[];
}

export interface Workspace {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  columns?: Column[];
  cards?: CardGql[];
  backlog?: CardGql[];
}

export interface CreateWorkspaceInput {
  title: string;
  description?: string;
  icon?: string;
}

export interface UpdateWorkspaceInput {
  title?: string;
  description?: string;
  icon?: string;
}
