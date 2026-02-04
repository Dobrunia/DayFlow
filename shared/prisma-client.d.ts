/** Stub for shared build; server uses real generated client. */
declare module "@prisma/client" {
  export interface User {
    id: string;
    email: string;
    [key: string]: unknown;
  }
  export interface Workspace {
    id: string;
    ownerId: string;
    [key: string]: unknown;
  }
  export interface Column {
    id: string;
    workspaceId: string;
    [key: string]: unknown;
  }
  export interface Card {
    id: string;
    ownerId: string;
    workspaceId: string | null;
    columnId: string | null;
    [key: string]: unknown;
  }
  export class PrismaClient {
    [key: string]: unknown;
  }
}
