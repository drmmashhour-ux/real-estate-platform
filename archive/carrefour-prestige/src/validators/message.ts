import { z } from "zod";

export const messageCreateSchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

export const threadCreateSchema = z.object({
  propertyId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).min(1).max(20),
  subject: z.string().max(200).optional(),
});
