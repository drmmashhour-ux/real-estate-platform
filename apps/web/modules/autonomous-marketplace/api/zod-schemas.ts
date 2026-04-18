import { z } from "zod";

export const autonomyModeSchema = z.enum(["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"]);

/** Listing-only preview POST — maps to `previewForListing` (no engine execution / persistence). */
export const listingPreviewInputSchema = z.object({
  listingId: z.string().min(1),
  dryRun: z.boolean().optional().default(true),
  source: z.enum(["web", "syria", "external"]).optional(),
  regionCode: z.string().min(1).max(32).optional(),
});

export const previewBodySchema = z.object({
  targetType: z.enum(["fsbo_listing", "lead", "campaign"]),
  targetId: z.string().min(1),
  mode: autonomyModeSchema.optional(),
  dryRun: z.boolean().optional(),
  detectorIds: z.array(z.string()).optional(),
  actionTypes: z.array(z.string()).optional(),
  idempotencyKey: z.string().max(256).optional(),
});

export const runListingBodySchema = z.object({
  listingId: z.string().min(1),
  mode: autonomyModeSchema.optional(),
  dryRun: z.boolean().optional(),
  detectorIds: z.array(z.string()).optional(),
  actionTypes: z.array(z.string()).optional(),
  idempotencyKey: z.string().max(256).optional(),
});

export const runLeadBodySchema = z.object({
  leadId: z.string().min(1),
  mode: autonomyModeSchema.optional(),
  dryRun: z.boolean().optional(),
  detectorIds: z.array(z.string()).optional(),
  actionTypes: z.array(z.string()).optional(),
  idempotencyKey: z.string().max(256).optional(),
});

export const runScheduledBodySchema = z.object({
  mode: autonomyModeSchema.optional(),
});

/** Admin-only listing preview — explicit `source` (required for Syria; no ambiguous cross-region fallback). */
export const adminListingPreviewBodySchema = z.object({
  listingId: z.string().min(1),
  source: z.enum(["web", "syria", "external"]),
  regionCode: z.string().min(1).max(32).optional(),
});
