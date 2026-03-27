import { z } from "zod";

const incidentTypes = ["FRAUD", "HARASSMENT", "INAPPROPRIATE_CONTENT", "SCAM", "SAFETY_CONCERN", "OTHER"] as const;
const incidentStatuses = ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"] as const;
const flagTargetTypes = ["ACCOUNT", "LISTING"] as const;
const flagStatuses = ["PENDING", "REVIEWED", "DISMISSED"] as const;
const suspensionTargetTypes = ["ACCOUNT", "LISTING"] as const;

export const createIncidentBodySchema = z.object({
  reporterId: z.string().uuid(),
  reportedUserId: z.string().uuid().optional(),
  reportedListingId: z.string().uuid().optional(),
  type: z.enum(incidentTypes),
  description: z.string().min(1).max(10000),
  priority: z.number().int().min(0).max(10).optional(),
}).refine(
  (data) => data.reportedUserId != null || data.reportedListingId != null,
  { message: "At least one of reportedUserId or reportedListingId required", path: ["reportedUserId"] }
);

export const listIncidentsQuerySchema = z.object({
  reporterId: z.string().uuid().optional(),
  reportedUserId: z.string().uuid().optional(),
  reportedListingId: z.string().uuid().optional(),
  status: z.enum(incidentStatuses).optional(),
  type: z.enum(incidentTypes).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const createFlagBodySchema = z.object({
  flaggerId: z.string().uuid(),
  targetType: z.enum(flagTargetTypes),
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(2000),
});

export const listFlagsQuerySchema = z.object({
  flaggerId: z.string().uuid().optional(),
  targetType: z.enum(flagTargetTypes).optional(),
  targetId: z.string().uuid().optional(),
  status: z.enum(flagStatuses).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const createSuspensionBodySchema = z.object({
  targetType: z.enum(suspensionTargetTypes),
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(2000),
  suspendedById: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const listSuspensionsQuerySchema = z.object({
  targetType: z.enum(suspensionTargetTypes).optional(),
  targetId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "LIFTED", "EXPIRED"]).optional(),
});

export type CreateIncidentBody = z.infer<typeof createIncidentBodySchema>;
export type ListIncidentsQuery = z.infer<typeof listIncidentsQuerySchema>;
export type CreateFlagBody = z.infer<typeof createFlagBodySchema>;
export type ListFlagsQuery = z.infer<typeof listFlagsQuerySchema>;
export type CreateSuspensionBody = z.infer<typeof createSuspensionBodySchema>;
export type ListSuspensionsQuery = z.infer<typeof listSuspensionsQuerySchema>;
