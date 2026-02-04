import { z } from "zod";

export const CardTypeEnum = z.enum(["note", "link", "checklist"]);
export type CardType = z.infer<typeof CardTypeEnum>;

export const NotePayloadSchema = z.object({
  content: z.string().optional(),
  summary: z.string().optional(),
});

export const LinkPayloadSchema = z.object({
  url: z.string().url(),
  summary: z.string().optional(),
});

export const ChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  done: z.boolean().default(false),
  order: z.number().int(),
});

export const ChecklistPayloadSchema = z.object({
  items: z.array(ChecklistItemSchema).default([]),
  summary: z.string().optional(),
});

export const CardPayloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("note"), payload: NotePayloadSchema }),
  z.object({ type: z.literal("link"), payload: LinkPayloadSchema }),
  z.object({ type: z.literal("checklist"), payload: ChecklistPayloadSchema }),
]);

export type CardPayload = z.infer<typeof CardPayloadSchema>;

export const CardSchema = z.object({
  id: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),

  ownerId: z.string(),
  workspaceId: z.string().nullable().optional(),
  columnId: z.string().nullable().optional(),
  order: z.number().int().nullable().optional(),

  title: z.string().nullable().optional(),
  done: z.boolean(),

  tags: z.array(z.string()).default([]),

  type: CardTypeEnum,
  payload: z.unknown(),
});

export type Card = z.infer<typeof CardSchema>;

export type NotePayload = z.infer<typeof NotePayloadSchema>;
export type LinkPayload = z.infer<typeof LinkPayloadSchema>;
export type ChecklistPayload = z.infer<typeof ChecklistPayloadSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export type CardTyped =
  | (Omit<Card, "payload" | "type"> & { type: "note"; payload: NotePayload })
  | (Omit<Card, "payload" | "type"> & { type: "link"; payload: LinkPayload })
  | (Omit<Card, "payload" | "type"> & { type: "checklist"; payload: ChecklistPayload });

export function parseCardTyped(input: unknown): CardTyped {
  const base = CardSchema.parse(input);
  const parsed = CardPayloadSchema.parse({
    type: base.type,
    payload: base.payload,
  });
  return {
    ...base,
    type: parsed.type,
    payload: parsed.payload,
  } as CardTyped;
}

// GraphQL / API inputs (shared backend + frontend)
export const CreateCardInputSchema = z.object({
  type: z.string(),
  title: z.string().optional(),
  workspaceId: z.string().optional(),
  columnId: z.string().optional(),
  payload: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateCardInput = z.infer<typeof CreateCardInputSchema>;

export const UpdateCardInputSchema = z.object({
  title: z.string().optional(),
  done: z.boolean().optional(),
  columnId: z.string().optional(),
  order: z.number().int().optional(),
  payload: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type UpdateCardInput = z.infer<typeof UpdateCardInputSchema>;

export const CardFilterSchema = z.object({
  type: z.string().optional(),
  done: z.boolean().optional(),
  workspaceId: z.string().optional(),
  columnId: z.string().optional(),
  search: z.string().optional(),
});
export type CardFilter = z.infer<typeof CardFilterSchema>;
