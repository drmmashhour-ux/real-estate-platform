import { z } from "zod";

export const queueQuerySchema = z.object({
  status: z.string().optional(),
  entityType: z.string().optional(),
  trustLevel: z.string().optional(),
  readinessLevel: z.string().optional(),
  assignedTo: z.string().optional(),
  severity: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export type QueueQuery = z.infer<typeof queueQuerySchema>;
