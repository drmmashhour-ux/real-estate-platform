import { z } from "zod";
import { claimListingOptimizationForApply } from "@/lib/ai/claim-listing-optimization-apply";
import { executeActions, type AutonomousAction, type ExecuteContext } from "@/lib/ai/executor";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { getGuestId } from "@/lib/auth/session";
import { getListingsDB, monolithPrisma } from "@/lib/db";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

const AutonomousActionZ = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("listing_improvement"),
    issues: z.array(z.string()),
    actions: z.array(z.string()),
  }),
  z.object({
    type: z.literal("price_update"),
    newPrice: z.number(),
    changePct: z.number().optional(),
    source: z.enum(["revenue_optimizer", "dynamic_pricing"]).optional(),
  }),
  z.object({
    type: z.literal("compliance_block"),
    message: z.string(),
  }),
  z.object({
    type: z.literal("manual_review_flag"),
    reason: z.string(),
  }),
]);

const BodyZ = z
  .object({
    /** When set, claim is idempotent: same suggestion cannot be applied twice (see `listing_optimization_suggestions.applied_at`). */
    suggestionId: z.string().min(1).optional(),
    actions: z.array(AutonomousActionZ).min(1),
    ctx: z
      .object({
        marketplaceListingId: z.string().min(1).optional(),
        crmListingId: z.string().min(1).optional(),
        shortTermListingId: z.string().min(1).optional(),
        /** When true, applies the same conversion A/B win gate as autonomy (default false for HITL). */
        requireConversionAbWin: z.boolean().optional(),
      })
      .refine(
        (c) => Boolean(c.marketplaceListingId) || Boolean(c.shortTermListingId),
        { message: "ctx.marketplaceListingId or ctx.shortTermListingId is required" }
      ),
  })
  .refine(
    (b) => !b.suggestionId || (Boolean(b.ctx.shortTermListingId) && b.actions.length === 1),
    { message: "suggestionId requires ctx.shortTermListingId and exactly one action" }
  );

export async function POST(req: Request) {
  if (isDemoMode) {
    return Response.json({ ok: true, executed: false, demo: true });
  }
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/ai/apply", phase: "parse_json" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { actions, ctx: rawCtx, suggestionId } = parsed.data;
  const ctx: ExecuteContext = {
    ...rawCtx,
    requireConversionAbWin: rawCtx.requireConversionAbWin === true,
  };

  if (suggestionId && rawCtx.shortTermListingId) {
    const claim = await claimListingOptimizationForApply({
      suggestionId,
      userId,
      shortTermListingId: rawCtx.shortTermListingId,
    });
    if (!claim.ok) {
      return Response.json(
        { error: claim.message },
        { status: claim.status }
      );
    }
  }

  if (rawCtx.shortTermListingId) {
    const st = await monolithPrisma.shortTermListing.findFirst({
      where: { id: rawCtx.shortTermListingId, ownerId: userId },
      select: { id: true },
    });
    if (!st) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  if (rawCtx.marketplaceListingId) {
    const row = await getListingsDB().listing.findFirst({
      where: { id: rawCtx.marketplaceListingId, userId },
      select: { id: true },
    });
    if (!row) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const r = await executeActions(actions as AutonomousAction[], ctx);
    return Response.json({
      ok: r !== "error",
      executeResult: r,
      executed: r === "ok",
      suggestedOptimizationClaimed: Boolean(suggestionId),
    });
  } catch (e) {
    logError(e, { route: "/api/ai/apply", phase: "executeActions" });
    return Response.json({ error: "Execution failed" }, { status: 500 });
  }
}
