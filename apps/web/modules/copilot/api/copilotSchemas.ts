import { z } from "zod";

export const copilotPostBodySchema = z.object({
  query: z.string().min(2).max(4000),
  conversationId: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
  watchlistId: z.string().optional(),
  /** When true, persist an AI-generated workflow plan alongside the Copilot reply (extra planner call). */
  withWorkflowPlan: z.boolean().optional().default(false),
});
