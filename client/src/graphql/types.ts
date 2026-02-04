/**
 * Типы из API (GraphQL). Сущности карточек — из dayflow-shared.
 */
export type {
  CardType,
  CreateCardInput,
  UpdateCardInput,
  CardFilter,
  NotePayload,
  LinkPayload,
  ChecklistPayload,
  ChecklistItem,
} from 'dayflow-shared';

import type { CardType as SharedCardType } from 'dayflow-shared';

/** Карточка как приходит с API: type в верхнем регистре, payload — JSON-строка */
export interface CardGql {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  workspaceId: string | null;
  columnId: string | null;
  order: number | null;
  type: Uppercase<SharedCardType>;
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

export interface Workspace {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  columns?: Column[];
  cards?: CardGql[];
  backlog?: CardGql[];
}

export interface Column {
  id: string;
  title: string;
  order: number;
  cards?: CardGql[];
}

export interface CreateWorkspaceInput {
  title: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  title?: string;
  description?: string;
}
