/**
 * Re-export API types from generated sources and local libs.
 */

// 1. GraphQL types (codegen)
export type {
  CardType,
  LearningStatus,
  User,
  Workspace,
  Column,
  Tool,
  CreateCardInput,
  UpdateCardInput,
  CardFilter,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreateToolInput,
  UpdateToolInput,
} from "../generated/graphql";

// Alias CardGql to the generated Card type
import type { Card } from "../generated/graphql";
export type CardGql = Card;

// 2. Payload types (Zod schemas)
export type {
  NotePayload,
  LinkPayload,
  ChecklistPayload,
  ChecklistItem,
} from "../lib/card-payload";
