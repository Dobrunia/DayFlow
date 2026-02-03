export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  columns?: Column[];
  backlogItems?: Item[];
}

export interface Column {
  id: string;
  title: string;
  order: number;
  cards?: Card[];
}

export type ItemType = 'NOTE' | 'LINK' | 'VIDEO' | 'REPO' | 'TASK';

export interface Item {
  id: string;
  title: string;
  type: ItemType;
  url?: string | null;
  content?: string | null;
  status?: string | null;
  done: boolean;
  meta?: string | null;
  createdAt: string;
  updatedAt: string;
  workspace?: Workspace | null;
}

export type CardType = 'VIDEO' | 'NOTE' | 'CHECKLIST';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Card {
  id: string;
  title: string;
  cardType: CardType;
  checked: boolean;
  order: number;
  createdAt: string;
  // Video fields
  videoUrl?: string | null;
  videoPreview?: string | null;
  videoDuration?: number | null;
  videoSource?: string | null;
  // Note fields
  noteContent?: string | null;
  // Checklist fields
  checklistItems?: ChecklistItem[] | null;
}

// Input types
export interface CreateWorkspaceInput {
  title: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  title?: string;
  description?: string;
}

export interface CreateItemInput {
  title: string;
  type: ItemType;
  url?: string;
  content?: string;
  workspaceId?: string;
  meta?: string;
}

export interface UpdateItemInput {
  title?: string;
  url?: string;
  content?: string;
  status?: string;
  done?: boolean;
  meta?: string;
}

export interface CreateCardInput {
  title: string;
  cardType: CardType;
  videoUrl?: string;
  noteContent?: string;
  checklistItems?: ChecklistItem[];
}

export interface UpdateCardInput {
  title?: string;
  checked?: boolean;
  videoUrl?: string;
  videoPreview?: string;
  videoDuration?: number;
  videoSource?: string;
  noteContent?: string;
  checklistItems?: ChecklistItem[];
}

export interface LibraryFilter {
  type?: ItemType;
  done?: boolean;
  search?: string;
}
