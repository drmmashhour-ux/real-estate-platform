import { assignVariant } from "@/lib/ab/assign";
import { isConversionAbGateEnabled, isWinningVariant } from "@/lib/ab/conversion-ab-gate";
import { CONVERSION_EXPERIMENT_V1 } from "@/lib/ab/experiments";
import { getListingsDB, monolithPrisma, prisma } from "@/lib/db";
import { MAX_ACTIONS_PER_HOUR } from "@/lib/ai/autonomy-constants";
import { sendAlert } from "@/lib/ai/alerts";
import { saveConversionBackup } from "@/lib/ai/conversion-backup.service";
import { detectConversionDrop } from "@/lib/ai/conversionSafety";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { logAiError } from "@/lib/observability/structured-log";
import { filterActions } from "@/lib/ai/guardrails";

export type AutonomousAction =
  | {
      type: "listing_improvement";
      issues: string[];
      actions: string[];
    }
  | {
      type: "price_update";
      newPrice: number;
      changePct?: number;
      /** When set, `filterActions` may allow a higher `changePct` cap (revenue optimizer). */
      source?: "revenue_optimizer" | "dynamic_pricing";
    }
  | { type: "compliance_block"; message: string }
  /** Queue for human / workflow — never applies CRM hard hold. */
  | { type: "manual_review_flag"; reason: string };

export type ExecuteContext = {
  /** `listings` table / `@repo/db-marketplace` (optional if only using BNHub path) */
  marketplaceListingId?: string;
  /** Monolith CRM `Listing.id` for compliance holds; omit if unknown */
  crmListingId?: string;
  /**
   * When set, `price_update` updates BNHub `nightPriceCents` from `newPrice` (major currency units
   * per `runAutonomousAgent` / `getDynamicPrice`); takes precedence over `marketplaceListingId`.
   */
  shortTermListingId?: string;
  /**
   * When true (autonomy paths) and `FEATURE_CONVERSION_AB_GATE=1`, only runs if
   * `growth_events` shows the listing’s `conversion_v1` bucket is the current “winner” with enough volume.
   * Manual `POST /api/ai/apply` should omit (default false) so humans can still apply.
   */
  requireConversionAbWin?: boolean;
  /** Optional: block when measured conversion **rates** would drop too sharply (rare: same-tick what-if). */
  conversionRateCheck?: { before: number; after: number };
};

const RATE_WINDOW_MS = 3_600_000;
const MAX_ACTIONS_PER_LISTING_PER_HOUR = MAX_ACTIONS_PER_HOUR;

/**
 * At most `MAX_ACTIONS_PER_LISTING_PER_HOUR` logged actions per listing per rolling hour
 * (enforced for batch: existing window count + `actionCount` must not exceed the cap).
 */
export async function canExecute(listingId: string, actionCount: number = 1): Promise<boolean> {
  if (!listingId) {
    return false;
  }
  const n = Math.max(1, Math.min(200, Math.floor(actionCount) || 1));
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  const c = await prisma.aiExecutionLog.count({
    where: {
      listingId,
      createdAt: { gte: since },
    },
  });
  return c + n <= MAX_ACTIONS_PER_LISTING_PER_HOUR;
}

/**
 * Inserts a row in `ai_execution_logs` (append-only audit). Optional before/after for rollback forensics.
 */
export async function logExecution(
  listingId: string,
  action: string,
  opts?: { beforeSnapshot?: object | null; afterSnapshot?: object | null }
): Promise<void> {
  await prisma.aiExecutionLog.create({
    data: {
      listingId,
      action: action.slice(0, 16_000),
      beforeSnapshot: opts?.beforeSnapshot === undefined ? undefined : opts.beforeSnapshot,
      afterSnapshot: opts?.afterSnapshot === undefined ? undefined : opts.afterSnapshot,
    },
  });
}

export type ExecuteResult =
  | "ok"
  | "no_actions"
  | "no_scope"
  | "rate_limited"
  | "ab_gated"
  | "conversion_unsafe"
  | "error";

/**
 * Materializes orchestrator output. `compliance_block` updates monolith CRM fields
 * (`crm_marketplace_live` + OACIQ hold) — the marketplace client has no `status` field.
 * Applies {@link filterActions} and rate limits before any write.
 */
export async function executeActions(
  actions: AutonomousAction[],
  ctx: ExecuteContext
): Promise<ExecuteResult> {
  if (isDemoMode) {
    return "no_actions";
  }
  try {
    const safeActions = filterActions(actions);
    if (safeActions.length === 0) {
      return "no_actions";
    }

    if (ctx.conversionRateCheck) {
      const { before, after } = ctx.conversionRateCheck;
      if (detectConversionDrop(before, after)) {
        console.warn("[CONVERSION BLOCK] drop detected", { before, after });
        sendAlert("Conversion safety block: drop before apply", { before, after });
        return "conversion_unsafe";
      }
    }

    const limitKey = ctx.marketplaceListingId ?? ctx.shortTermListingId ?? ctx.crmListingId;
    if (!limitKey) {
      console.warn("[AI BLOCKED] missing ctx.marketplaceListingId, shortTermListingId, or crmListingId");
      sendAlert("Autonomy blocked — missing execution scope in ctx", { marketplaceListingId: ctx.marketplaceListingId });
      return "no_scope";
    }

    if (ctx.requireConversionAbWin && isConversionAbGateEnabled()) {
      const v = assignVariant(limitKey, CONVERSION_EXPERIMENT_V1);
      if (!(await isWinningVariant(CONVERSION_EXPERIMENT_V1, v))) {
        console.log("[AB BLOCK] not a winning variant", { experiment: CONVERSION_EXPERIMENT_V1, listingId: limitKey, variant: v });
        return "ab_gated";
      }
    }

    if (!(await canExecute(limitKey, safeActions.length))) {
      console.warn("[AI BLOCKED] rate limit", { listingId: limitKey, batchSize: safeActions.length });
      sendAlert("Autonomy rate limit (hourly cap)", { listingId: limitKey, batchSize: safeActions.length });
      return "rate_limited";
    }

    for (const action of safeActions) {
      switch (action.type) {
      case "price_update":
        if (ctx.shortTermListingId) {
          const beforeSt = await monolithPrisma.shortTermListing.findUnique({
            where: { id: ctx.shortTermListingId },
            select: { nightPriceCents: true },
          });
          if (beforeSt) {
            await saveConversionBackup(limitKey, {
              source: "bnhub",
              shortTermListingId: ctx.shortTermListingId,
              nightPriceCents: beforeSt.nightPriceCents,
            });
          }
          const newCents = Math.round(action.newPrice * 100);
          await monolithPrisma.shortTermListing.update({
            where: { id: ctx.shortTermListingId },
            data: { nightPriceCents: newCents },
          });
          await logExecution(limitKey, JSON.stringify(action), {
            beforeSnapshot: { nightPriceCents: beforeSt?.nightPriceCents ?? null, source: "bnhub" },
            afterSnapshot: { nightPriceCents: newCents, source: "bnhub" },
          });
        } else if (ctx.marketplaceListingId) {
          const before = await getListingsDB().listing.findUnique({
            where: { id: ctx.marketplaceListingId },
            select: { price: true },
          });
          if (before) {
            await saveConversionBackup(limitKey, {
              source: "marketplace",
              listingId: ctx.marketplaceListingId,
              price: before.price,
            });
          }
          await getListingsDB().listing.update({
            where: { id: ctx.marketplaceListingId },
            data: { price: action.newPrice },
          });
          await logExecution(limitKey, JSON.stringify(action), {
            beforeSnapshot: { price: before?.price ?? null, source: "marketplace" },
            afterSnapshot: { price: action.newPrice, source: "marketplace" },
          });
        } else {
          throw new Error(
            "[executeActions] price_update requires shortTermListingId and/or marketplaceListingId in ctx"
          );
        }
        break;

      case "listing_improvement":
        await logExecution(limitKey, JSON.stringify(action));
        console.log("Suggest improvements:", action.actions, "issues:", action.issues);
        break;

        case "compliance_block": {
          const monolithId = ctx.crmListingId ?? ctx.marketplaceListingId;
          try {
            await monolithPrisma.listing.update({
              where: { id: monolithId },
              data: {
                crmMarketplaceLive: false,
                lecipmOaciqComplianceHoldAt: new Date(),
                lecipmOaciqComplianceHoldReason: "compliance_block",
              },
            });
            sendAlert("Compliance block applied to listing (CRM hold)", { listingId: monolithId, reason: "compliance_block" });
          } catch (e) {
            console.error(
              "[executeActions] compliance_block: CRM listing update failed (check crmListingId)",
              e
            );
          }
          await logExecution(limitKey, JSON.stringify(action));
          break;
        }

        case "manual_review_flag":
          await logExecution(limitKey, JSON.stringify(action));
          console.warn("[trust] manual_review_flag", { listingId: limitKey, reason: action.reason });
          sendAlert("Listing queued for manual review (trust policy)", { listingId: limitKey, reason: action.reason });
          break;
      }
    }
    return "ok";
  } catch (e) {
    logAiError("executeActions", e, { marketplaceListingId: ctx.marketplaceListingId, shortTermListingId: ctx.shortTermListingId });
    return "error";
  }
}
