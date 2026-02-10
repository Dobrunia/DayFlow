import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { User as UserModel, Workspace as WorkspaceModel, Column as ColumnModel, Card as CardModel } from '@prisma/client';
import { Context } from '../lib/types';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AuthPayload: ResolverTypeWrapper<Omit<AuthPayload, 'user'> & { user: ResolversTypes['User'] }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Card: ResolverTypeWrapper<CardModel>;
  CardFilter: CardFilter;
  CardType: CardType;
  Column: ResolverTypeWrapper<ColumnModel>;
  CreateCardInput: CreateCardInput;
  CreateToolInput: CreateToolInput;
  CreateWorkspaceInput: CreateWorkspaceInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  LearningStatus: LearningStatus;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Roadmap: ResolverTypeWrapper<Roadmap>;
  RoadmapNode: ResolverTypeWrapper<RoadmapNode>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Tool: ResolverTypeWrapper<Omit<Tool, 'owner' | 'workspace'> & { owner: ResolversTypes['User'], workspace?: Maybe<ResolversTypes['Workspace']> }>;
  UpdateCardInput: UpdateCardInput;
  UpdateToolInput: UpdateToolInput;
  UpdateWorkspaceInput: UpdateWorkspaceInput;
  User: ResolverTypeWrapper<UserModel>;
  UserStats: ResolverTypeWrapper<UserStats>;
  Workspace: ResolverTypeWrapper<WorkspaceModel>;
  WorkspaceStatsItem: ResolverTypeWrapper<WorkspaceStatsItem>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AuthPayload: Omit<AuthPayload, 'user'> & { user: ResolversParentTypes['User'] };
  Boolean: Scalars['Boolean']['output'];
  Card: CardModel;
  CardFilter: CardFilter;
  Column: ColumnModel;
  CreateCardInput: CreateCardInput;
  CreateToolInput: CreateToolInput;
  CreateWorkspaceInput: CreateWorkspaceInput;
  DateTime: Scalars['DateTime']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  Roadmap: Roadmap;
  RoadmapNode: RoadmapNode;
  String: Scalars['String']['output'];
  Tool: Omit<Tool, 'owner' | 'workspace'> & { owner: ResolversParentTypes['User'], workspace?: Maybe<ResolversParentTypes['Workspace']> };
  UpdateCardInput: UpdateCardInput;
  UpdateToolInput: UpdateToolInput;
  UpdateWorkspaceInput: UpdateWorkspaceInput;
  User: UserModel;
  UserStats: UserStats;
  Workspace: WorkspaceModel;
  WorkspaceStatsItem: WorkspaceStatsItem;
}>;

export type AuthPayloadResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload']> = ResolversObject<{
  token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
}>;

export type CardResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Card'] = ResolversParentTypes['Card']> = ResolversObject<{
  column?: Resolver<Maybe<ResolversTypes['Column']>, ParentType, ContextType>;
  columnId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  done?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  learningStatus?: Resolver<Maybe<ResolversTypes['LearningStatus']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  ownerId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  payload?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['CardType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  workspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
  workspaceId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
}>;

export type ColumnResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Column'] = ResolversParentTypes['Column']> = ResolversObject<{
  cards?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType>;
  color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hideCompleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createCard?: Resolver<ResolversTypes['Card'], ParentType, ContextType, RequireFields<MutationCreateCardArgs, 'input'>>;
  createColumn?: Resolver<ResolversTypes['Column'], ParentType, ContextType, RequireFields<MutationCreateColumnArgs, 'title' | 'workspaceId'>>;
  createRoadmap?: Resolver<ResolversTypes['Roadmap'], ParentType, ContextType, RequireFields<MutationCreateRoadmapArgs, 'title' | 'workspaceId'>>;
  createRoadmapNode?: Resolver<ResolversTypes['RoadmapNode'], ParentType, ContextType, RequireFields<MutationCreateRoadmapNodeArgs, 'roadmapId' | 'title'>>;
  createTool?: Resolver<ResolversTypes['Tool'], ParentType, ContextType, RequireFields<MutationCreateToolArgs, 'input'>>;
  createWorkspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<MutationCreateWorkspaceArgs, 'input'>>;
  deleteCard?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteCardArgs, 'id'>>;
  deleteColumn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteColumnArgs, 'id'>>;
  deleteRoadmap?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteRoadmapArgs, 'id'>>;
  deleteRoadmapNode?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteRoadmapNodeArgs, 'id'>>;
  deleteTool?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteToolArgs, 'id'>>;
  deleteWorkspace?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteWorkspaceArgs, 'id'>>;
  moveCard?: Resolver<ResolversTypes['Card'], ParentType, ContextType, RequireFields<MutationMoveCardArgs, 'id' | 'order'>>;
  reorderColumns?: Resolver<Array<ResolversTypes['Column']>, ParentType, ContextType, RequireFields<MutationReorderColumnsArgs, 'columnIds' | 'workspaceId'>>;
  reorderRoadmapNodes?: Resolver<Array<ResolversTypes['RoadmapNode']>, ParentType, ContextType, RequireFields<MutationReorderRoadmapNodesArgs, 'nodeIds' | 'roadmapId'>>;
  signIn?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationSignInArgs, 'email' | 'password'>>;
  signOut?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  signUp?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationSignUpArgs, 'email' | 'password'>>;
  toggleWorkspacePinned?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<MutationToggleWorkspacePinnedArgs, 'id'>>;
  updateCard?: Resolver<ResolversTypes['Card'], ParentType, ContextType, RequireFields<MutationUpdateCardArgs, 'id' | 'input'>>;
  updateColumn?: Resolver<ResolversTypes['Column'], ParentType, ContextType, RequireFields<MutationUpdateColumnArgs, 'id'>>;
  updateProfile?: Resolver<ResolversTypes['User'], ParentType, ContextType, Partial<MutationUpdateProfileArgs>>;
  updateRoadmapNode?: Resolver<ResolversTypes['RoadmapNode'], ParentType, ContextType, RequireFields<MutationUpdateRoadmapNodeArgs, 'id'>>;
  updateTool?: Resolver<ResolversTypes['Tool'], ParentType, ContextType, RequireFields<MutationUpdateToolArgs, 'id' | 'input'>>;
  updateWorkspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<MutationUpdateWorkspaceArgs, 'id' | 'input'>>;
}>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  allTools?: Resolver<Array<ResolversTypes['Tool']>, ParentType, ContextType>;
  card?: Resolver<Maybe<ResolversTypes['Card']>, ParentType, ContextType, RequireFields<QueryCardArgs, 'id'>>;
  cards?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType, Partial<QueryCardsArgs>>;
  cardsCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType, Partial<QueryCardsCountArgs>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  myWorkspaces?: Resolver<Array<ResolversTypes['Workspace']>, ParentType, ContextType>;
  roadmap?: Resolver<Maybe<ResolversTypes['Roadmap']>, ParentType, ContextType, RequireFields<QueryRoadmapArgs, 'workspaceId'>>;
  tools?: Resolver<Array<ResolversTypes['Tool']>, ParentType, ContextType, Partial<QueryToolsArgs>>;
  userStats?: Resolver<Maybe<ResolversTypes['UserStats']>, ParentType, ContextType, RequireFields<QueryUserStatsArgs, 'userId'>>;
  workspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType, RequireFields<QueryWorkspaceArgs, 'id'>>;
}>;

export type RoadmapResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Roadmap'] = ResolversParentTypes['Roadmap']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['RoadmapNode']>, ParentType, ContextType>;
  ownerId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  sourceText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  workspaceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
}>;

export type RoadmapNodeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['RoadmapNode'] = ResolversParentTypes['RoadmapNode']> = ResolversObject<{
  children?: Resolver<Array<ResolversTypes['RoadmapNode']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  done?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  parentId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  roadmapId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
}>;

export type ToolResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Tool'] = ResolversParentTypes['Tool']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  link?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  ownerId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  workspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
  workspaceId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  avatarUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  workspaces?: Resolver<Array<ResolversTypes['Workspace']>, ParentType, ContextType>;
}>;

export type UserStatsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserStats'] = ResolversParentTypes['UserStats']> = ResolversObject<{
  avatarUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  totalCompletedCards?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  workspaceStats?: Resolver<Array<ResolversTypes['WorkspaceStatsItem']>, ParentType, ContextType>;
}>;

export type WorkspaceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Workspace'] = ResolversParentTypes['Workspace']> = ResolversObject<{
  backlog?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType>;
  cards?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType>;
  columns?: Resolver<Array<ResolversTypes['Column']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  pinned?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  roadmap?: Resolver<Maybe<ResolversTypes['Roadmap']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tools?: Resolver<Array<ResolversTypes['Tool']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
}>;

export type WorkspaceStatsItemResolvers<ContextType = Context, ParentType extends ResolversParentTypes['WorkspaceStatsItem'] = ResolversParentTypes['WorkspaceStatsItem']> = ResolversObject<{
  completedCards?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalCards?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  Card?: CardResolvers<ContextType>;
  Column?: ColumnResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Roadmap?: RoadmapResolvers<ContextType>;
  RoadmapNode?: RoadmapNodeResolvers<ContextType>;
  Tool?: ToolResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserStats?: UserStatsResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
  WorkspaceStatsItem?: WorkspaceStatsItemResolvers<ContextType>;
}>;

