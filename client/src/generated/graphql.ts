export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token?: Maybe<Scalars['String']['output']>;
  user: User;
};

export type Card = {
  __typename?: 'Card';
  column?: Maybe<Column>;
  columnId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  done: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  learningStatus?: Maybe<LearningStatus>;
  order?: Maybe<Scalars['Int']['output']>;
  owner: User;
  ownerId: Scalars['ID']['output'];
  payload: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  type: CardType;
  updatedAt: Scalars['DateTime']['output'];
  workspace?: Maybe<Workspace>;
  workspaceId?: Maybe<Scalars['ID']['output']>;
};

export type CardFilter = {
  columnId?: InputMaybe<Scalars['ID']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  learningStatus?: InputMaybe<LearningStatus>;
  search?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<CardType>;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
};

export type CardType =
  | 'checklist'
  | 'link'
  | 'note';

export type Column = {
  __typename?: 'Column';
  cards: Array<Card>;
  color?: Maybe<Scalars['String']['output']>;
  hideCompleted: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  workspace: Workspace;
};

export type CreateCardInput = {
  columnId?: InputMaybe<Scalars['ID']['input']>;
  learningStatus?: InputMaybe<LearningStatus>;
  payload?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
  type: CardType;
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateToolInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  link?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateWorkspaceInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type LearningStatus =
  | 'deepen_knowledge'
  | 'in_progress'
  | 'questions_remain'
  | 'want_to_repeat';

export type Mutation = {
  __typename?: 'Mutation';
  createCard: Card;
  createColumn: Column;
  createRoadmap: Roadmap;
  createRoadmapNode: RoadmapNode;
  createTool: Tool;
  createWorkspace: Workspace;
  deleteCard: Scalars['Boolean']['output'];
  deleteColumn: Scalars['Boolean']['output'];
  deleteRoadmap: Scalars['Boolean']['output'];
  deleteRoadmapNode: Scalars['Boolean']['output'];
  deleteTool: Scalars['Boolean']['output'];
  deleteWorkspace: Scalars['Boolean']['output'];
  moveCard: Card;
  reorderColumns: Array<Column>;
  reorderRoadmapNodes: Array<RoadmapNode>;
  signIn: AuthPayload;
  signOut: Scalars['Boolean']['output'];
  signUp: AuthPayload;
  toggleWorkspacePinned: Workspace;
  updateCard: Card;
  updateColumn: Column;
  updateProfile: User;
  updateRoadmapNode: RoadmapNode;
  updateTool: Tool;
  updateWorkspace: Workspace;
};


export type MutationCreateCardArgs = {
  input: CreateCardInput;
};


export type MutationCreateColumnArgs = {
  title: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};


export type MutationCreateRoadmapArgs = {
  sourceText?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};


export type MutationCreateRoadmapNodeArgs = {
  parentId?: InputMaybe<Scalars['ID']['input']>;
  roadmapId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};


export type MutationCreateToolArgs = {
  input: CreateToolInput;
};


export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};


export type MutationDeleteCardArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteColumnArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRoadmapArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRoadmapNodeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteToolArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWorkspaceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMoveCardArgs = {
  columnId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  order: Scalars['Int']['input'];
};


export type MutationReorderColumnsArgs = {
  columnIds: Array<Scalars['ID']['input']>;
  workspaceId: Scalars['ID']['input'];
};


export type MutationReorderRoadmapNodesArgs = {
  nodeIds: Array<Scalars['ID']['input']>;
  parentId?: InputMaybe<Scalars['ID']['input']>;
  roadmapId: Scalars['ID']['input'];
};


export type MutationSignInArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationSignUpArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationToggleWorkspacePinnedArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateCardArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCardInput;
};


export type MutationUpdateColumnArgs = {
  color?: InputMaybe<Scalars['String']['input']>;
  hideCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateProfileArgs = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateRoadmapNodeArgs = {
  done?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateToolArgs = {
  id: Scalars['ID']['input'];
  input: UpdateToolInput;
};


export type MutationUpdateWorkspaceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWorkspaceInput;
};

export type Query = {
  __typename?: 'Query';
  /** Все инструменты пользователя (все воркспейсы + хаб). */
  allTools: Array<Tool>;
  card?: Maybe<Card>;
  /** Все карточки пользователя (хаб: workspaceId = null, или по фильтру). sortOrder: createdAt_DESC (по умолчанию) | createdAt_ASC */
  cards: Array<Card>;
  /** Число карточек по фильтру (для пагинации). */
  cardsCount: Scalars['Int']['output'];
  me?: Maybe<User>;
  myWorkspaces: Array<Workspace>;
  /** Роадмап воркспейса (один на воркспейс). */
  roadmap?: Maybe<Roadmap>;
  /** Инструменты пользователя (хаб: workspaceId = null). */
  tools: Array<Tool>;
  /** Публичная статистика пользователя по id (любой авторизованный может запросить). */
  userStats?: Maybe<UserStats>;
  workspace?: Maybe<Workspace>;
};


export type QueryCardArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCardsArgs = {
  filter?: InputMaybe<CardFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCardsCountArgs = {
  filter?: InputMaybe<CardFilter>;
};


export type QueryRoadmapArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type QueryToolsArgs = {
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserStatsArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryWorkspaceArgs = {
  id: Scalars['ID']['input'];
};

export type Roadmap = {
  __typename?: 'Roadmap';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  nodes: Array<RoadmapNode>;
  ownerId: Scalars['ID']['output'];
  sourceText?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workspaceId: Scalars['ID']['output'];
};

export type RoadmapNode = {
  __typename?: 'RoadmapNode';
  children: Array<RoadmapNode>;
  createdAt: Scalars['DateTime']['output'];
  done: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  roadmapId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Tool = {
  __typename?: 'Tool';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  link?: Maybe<Scalars['String']['output']>;
  owner: User;
  ownerId: Scalars['ID']['output'];
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workspace?: Maybe<Workspace>;
  workspaceId?: Maybe<Scalars['ID']['output']>;
};

export type UpdateCardInput = {
  columnId?: InputMaybe<Scalars['ID']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
  learningStatus?: InputMaybe<LearningStatus>;
  order?: InputMaybe<Scalars['Int']['input']>;
  payload?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateToolInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  link?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWorkspaceInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  workspaces: Array<Workspace>;
};

/** Публичная статистика пользователя (доступна любому авторизованному). */
export type UserStats = {
  __typename?: 'UserStats';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Всего выполненных карточек (done = true). */
  totalCompletedCards: Scalars['Int']['output'];
  /** Воркспейсы пользователя с прогрессом (без доступа к контенту). */
  workspaceStats: Array<WorkspaceStatsItem>;
};

export type Workspace = {
  __typename?: 'Workspace';
  /** Карточки воркспейса без колонки (backlog). */
  backlog: Array<Card>;
  cards: Array<Card>;
  columns: Array<Column>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  owner: User;
  pinned: Scalars['Boolean']['output'];
  /** Роадмап воркспейса (один на воркспейс). */
  roadmap?: Maybe<Roadmap>;
  title: Scalars['String']['output'];
  /** Инструменты воркспейса. */
  tools: Array<Tool>;
  updatedAt: Scalars['DateTime']['output'];
};

/** Воркспейс с агрегатами: выполнено / всего карточек. */
export type WorkspaceStatsItem = {
  __typename?: 'WorkspaceStatsItem';
  completedCards: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  totalCards: Scalars['Int']['output'];
};

export type SignUpMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type SignUpMutation = { __typename?: 'Mutation', signUp: { __typename?: 'AuthPayload', token?: string | null, user: { __typename?: 'User', id: string, email: string, avatarUrl?: string | null, createdAt: any } } };

export type SignInMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type SignInMutation = { __typename?: 'Mutation', signIn: { __typename?: 'AuthPayload', token?: string | null, user: { __typename?: 'User', id: string, email: string, avatarUrl?: string | null, createdAt: any } } };

export type SignOutMutationVariables = Exact<{ [key: string]: never; }>;


export type SignOutMutation = { __typename?: 'Mutation', signOut: boolean };

export type UpdateProfileMutationVariables = Exact<{
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'User', id: string, email: string, avatarUrl?: string | null, createdAt: any } };

export type CreateWorkspaceMutationVariables = Exact<{
  input: CreateWorkspaceInput;
}>;


export type CreateWorkspaceMutation = { __typename?: 'Mutation', createWorkspace: { __typename?: 'Workspace', id: string, title: string, description?: string | null, icon?: string | null, pinned: boolean, createdAt: any, updatedAt: any } };

export type UpdateWorkspaceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateWorkspaceInput;
}>;


export type UpdateWorkspaceMutation = { __typename?: 'Mutation', updateWorkspace: { __typename?: 'Workspace', id: string, title: string, description?: string | null, icon?: string | null } };

export type DeleteWorkspaceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWorkspaceMutation = { __typename?: 'Mutation', deleteWorkspace: boolean };

export type ToggleWorkspacePinnedMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ToggleWorkspacePinnedMutation = { __typename?: 'Mutation', toggleWorkspacePinned: { __typename?: 'Workspace', id: string, pinned: boolean } };

export type CreateColumnMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
}>;


export type CreateColumnMutation = { __typename?: 'Mutation', createColumn: { __typename?: 'Column', id: string, title: string, order: number } };

export type UpdateColumnMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  hideCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateColumnMutation = { __typename?: 'Mutation', updateColumn: { __typename?: 'Column', id: string, title: string, hideCompleted: boolean, color?: string | null } };

export type DeleteColumnMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteColumnMutation = { __typename?: 'Mutation', deleteColumn: boolean };

export type ReorderColumnsMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  columnIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type ReorderColumnsMutation = { __typename?: 'Mutation', reorderColumns: Array<{ __typename?: 'Column', id: string, order: number }> };

export type CreateCardMutationVariables = Exact<{
  input: CreateCardInput;
}>;


export type CreateCardMutation = { __typename?: 'Mutation', createCard: { __typename?: 'Card', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, columnId?: string | null, order?: number | null, type: CardType, title?: string | null, done: boolean, payload: string, tags: Array<string>, learningStatus?: LearningStatus | null } };

export type UpdateCardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateCardInput;
}>;


export type UpdateCardMutation = { __typename?: 'Mutation', updateCard: { __typename?: 'Card', id: string, type: CardType, title?: string | null, done: boolean, payload: string, tags: Array<string>, learningStatus?: LearningStatus | null } };

export type DeleteCardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteCardMutation = { __typename?: 'Mutation', deleteCard: boolean };

export type MoveCardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  columnId?: InputMaybe<Scalars['ID']['input']>;
  order: Scalars['Int']['input'];
}>;


export type MoveCardMutation = { __typename?: 'Mutation', moveCard: { __typename?: 'Card', id: string, columnId?: string | null, order?: number | null } };

export type CreateToolMutationVariables = Exact<{
  input: CreateToolInput;
}>;


export type CreateToolMutation = { __typename?: 'Mutation', createTool: { __typename?: 'Tool', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, title: string, link?: string | null, description?: string | null, icon?: string | null, tags: Array<string> } };

export type UpdateToolMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateToolInput;
}>;


export type UpdateToolMutation = { __typename?: 'Mutation', updateTool: { __typename?: 'Tool', id: string, title: string, link?: string | null, description?: string | null, icon?: string | null, tags: Array<string> } };

export type DeleteToolMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteToolMutation = { __typename?: 'Mutation', deleteTool: boolean };

export type CreateRoadmapMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  sourceText?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateRoadmapMutation = { __typename?: 'Mutation', createRoadmap: { __typename?: 'Roadmap', id: string, createdAt: any, updatedAt: any, title: string, sourceText?: string | null, workspaceId: string } };

export type DeleteRoadmapMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRoadmapMutation = { __typename?: 'Mutation', deleteRoadmap: boolean };

export type CreateRoadmapNodeMutationVariables = Exact<{
  roadmapId: Scalars['ID']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
}>;


export type CreateRoadmapNodeMutation = { __typename?: 'Mutation', createRoadmapNode: { __typename?: 'RoadmapNode', id: string, roadmapId: string, parentId?: string | null, order: number, title: string, done: boolean } };

export type UpdateRoadmapNodeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  done?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateRoadmapNodeMutation = { __typename?: 'Mutation', updateRoadmapNode: { __typename?: 'RoadmapNode', id: string, title: string, done: boolean } };

export type DeleteRoadmapNodeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRoadmapNodeMutation = { __typename?: 'Mutation', deleteRoadmapNode: boolean };

export type ReorderRoadmapNodesMutationVariables = Exact<{
  roadmapId: Scalars['ID']['input'];
  parentId?: InputMaybe<Scalars['ID']['input']>;
  nodeIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type ReorderRoadmapNodesMutation = { __typename?: 'Mutation', reorderRoadmapNodes: Array<{ __typename?: 'RoadmapNode', id: string, order: number }> };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, email: string, avatarUrl?: string | null, createdAt: any } | null };

export type MyWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyWorkspacesQuery = { __typename?: 'Query', myWorkspaces: Array<{ __typename?: 'Workspace', id: string, title: string, description?: string | null, icon?: string | null, pinned: boolean, createdAt: any, updatedAt: any }> };

export type WorkspaceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WorkspaceQuery = { __typename?: 'Query', workspace?: { __typename?: 'Workspace', id: string, title: string, description?: string | null, icon?: string | null, createdAt: any, updatedAt: any, tools: Array<{ __typename?: 'Tool', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, title: string, link?: string | null, description?: string | null, icon?: string | null, tags: Array<string> }>, columns: Array<{ __typename?: 'Column', id: string, title: string, order: number, hideCompleted: boolean, color?: string | null, cards: Array<{ __typename?: 'Card', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, columnId?: string | null, order?: number | null, type: CardType, title?: string | null, done: boolean, payload: string, tags: Array<string>, learningStatus?: LearningStatus | null }> }>, backlog: Array<{ __typename?: 'Card', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, columnId?: string | null, order?: number | null, type: CardType, title?: string | null, done: boolean, payload: string, tags: Array<string>, learningStatus?: LearningStatus | null }> } | null };

export type CardsQueryVariables = Exact<{
  filter?: InputMaybe<CardFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
}>;


export type CardsQuery = { __typename?: 'Query', cards: Array<{ __typename?: 'Card', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, columnId?: string | null, order?: number | null, type: CardType, title?: string | null, done: boolean, payload: string, tags: Array<string>, learningStatus?: LearningStatus | null, workspace?: { __typename?: 'Workspace', id: string, title: string, icon?: string | null } | null }> };

export type CardsCountQueryVariables = Exact<{
  filter?: InputMaybe<CardFilter>;
}>;


export type CardsCountQuery = { __typename?: 'Query', cardsCount: number };

export type CardQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CardQuery = { __typename?: 'Query', card?: { __typename?: 'Card', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, columnId?: string | null, order?: number | null, type: CardType, title?: string | null, done: boolean, payload: string, tags: Array<string>, learningStatus?: LearningStatus | null } | null };

export type UserStatsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UserStatsQuery = { __typename?: 'Query', userStats?: { __typename?: 'UserStats', id: string, avatarUrl?: string | null, totalCompletedCards: number, workspaceStats: Array<{ __typename?: 'WorkspaceStatsItem', id: string, title: string, description?: string | null, icon?: string | null, totalCards: number, completedCards: number }> } | null };

export type ToolsQueryVariables = Exact<{
  workspaceId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type ToolsQuery = { __typename?: 'Query', tools: Array<{ __typename?: 'Tool', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, title: string, link?: string | null, description?: string | null, icon?: string | null, tags: Array<string> }> };

export type AllToolsQueryVariables = Exact<{ [key: string]: never; }>;


export type AllToolsQuery = { __typename?: 'Query', allTools: Array<{ __typename?: 'Tool', id: string, createdAt: any, updatedAt: any, ownerId: string, workspaceId?: string | null, title: string, link?: string | null, description?: string | null, icon?: string | null, tags: Array<string>, workspace?: { __typename?: 'Workspace', id: string, title: string, icon?: string | null } | null }> };

export type RoadmapQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type RoadmapQuery = { __typename?: 'Query', roadmap?: { __typename?: 'Roadmap', id: string, createdAt: any, updatedAt: any, title: string, sourceText?: string | null, workspaceId: string, nodes: Array<{ __typename?: 'RoadmapNode', id: string, roadmapId: string, parentId?: string | null, order: number, title: string, done: boolean, children: Array<{ __typename?: 'RoadmapNode', id: string, roadmapId: string, parentId?: string | null, order: number, title: string, done: boolean, children: Array<{ __typename?: 'RoadmapNode', id: string, roadmapId: string, parentId?: string | null, order: number, title: string, done: boolean, children: Array<{ __typename?: 'RoadmapNode', id: string, roadmapId: string, parentId?: string | null, order: number, title: string, done: boolean }> }> }> }> } | null };
