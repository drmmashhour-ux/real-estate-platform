import { z } from "zod";

export const createConversationBodySchema = z.object({
  participantUserIds: z.array(z.string().uuid()).min(1, "At least one participant required").max(20),
});

export const conversationIdParamSchema = z.object({
  conversationId: z.string().uuid(),
});

export const listConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const createMessageBodySchema = z.object({
  body: z.string().min(1).max(50000),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.string().max(100),
        filename: z.string().max(255).optional(),
      })
    )
    .max(10)
    .optional(),
});

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().datetime().optional(),
});

export type CreateConversationBody = z.infer<typeof createConversationBodySchema>;
export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
export type CreateMessageBody = z.infer<typeof createMessageBodySchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
