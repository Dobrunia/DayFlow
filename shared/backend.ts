/// <reference path="./prisma-client.d.ts" />
import type DataLoader from "dataloader";
import type { User, Workspace, Column, Card, PrismaClient } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
}

export interface DataLoaders {
  userById: DataLoader<string, User | null>;
  workspaceById: DataLoader<string, Workspace | null>;
  columnsByWorkspaceId: DataLoader<string, Column[]>;
  cardsByColumnId: DataLoader<string, Card[]>;
  cardsByWorkspaceId: DataLoader<string, Card[]>;
}

export interface Context {
  prisma: PrismaClient;
  user: SessionUser | null;
  sessionToken: string | null;
  loaders: DataLoaders;
  setCookie: (name: string, value: string, attributes: Record<string, unknown>) => void;
  deleteCookie: (name: string) => void;
}
