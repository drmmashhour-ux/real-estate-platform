import { z } from "zod";

export const workspaceIdParamsSchema = z.object({
  workspaceId: z.string().min(1),
});

export const documentApprovalStartSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  documentType: z.string().min(1),
  workspaceId: z.string().min(1).nullable().optional(),
});

export const documentApprovalActionSchema = z.object({
  actionType: z.enum(["approve", "reject", "request_changes", "reassign", "escalate"]),
  notes: z.string().max(8000).optional(),
  targetUserId: z.string().optional(),
});

export const workspaceAssignmentSchema = z.object({
  caseId: z.string().uuid(),
  assignedTo: z.string().min(1),
  priority: z.enum(["low", "normal", "high"]).optional(),
  dueAt: z.string().datetime().optional(),
});

export const portfolioAnalyticsQuerySchema = z.object({
  entityType: z.string().optional(),
  trustLevel: z.string().optional(),
  readinessLevel: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
