import { z } from "zod";

export const adminAiQueryBodySchema = z.object({
  question: z.string().min(2).max(2000),
});

export const adminAiRunBodySchema = z.object({
  runType: z.string().min(1).max(64).optional(),
});

export type AdminAiQueryBody = z.infer<typeof adminAiQueryBodySchema>;
