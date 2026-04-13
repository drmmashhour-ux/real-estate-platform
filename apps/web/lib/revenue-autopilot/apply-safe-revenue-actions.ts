import type { RevenueAutopilotAction, RevenueAutopilotSetting } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runListingAutopilot } from "@/lib/autopilot/run-listing-autopilot";
import { getOrCreateListingAutopilotSettings } from "@/lib/autopilot/get-autopilot-settings";
import { runPortfolioAutopilot } from "@/lib/portfolio-autopilot/run-portfolio-autopilot";
import { getOrCreateRevenueAutopilotSettings } from "./get-revenue-settings";
import { logRevenueAutopilotEvent } from "./log-revenue-event";
import {
  ACTION_BROKER_FOLLOWUP,
  ACTION_GENERATE_CONTENT,
  ACTION_IMPROVE_CONVERSION,
  ACTION_PROMOTE_LISTING,
  ACTION_RECOVER_ABANDONED,
  ACTION_SUGGEST_PRICE_REVIEW,
  ACTION_TRIGGER_LISTING_OPT,
  ACTION_TRIGGER_PORTFOLIO,
  ACTION_UPSELL_FEATURED,
  revenueSafeAutoEnabled,
} from "./validators";

async function listingOptAllowed(ownerId: string): Promise<boolean> {
  const s = await getOrCreateListingAutopilotSettings(ownerId);
  return s.mode !== "off";
}

export async function executeRevenueActionDownstream(input: {
  action: RevenueAutopilotAction;
  settings: RevenueAutopilotSetting;
  performedByUserId: string | null;
  ownerUserIdForListingRuns: string | null;
}): Promise<{ ok: boolean; detail?: Record<string, unknown> }> {
  const { action, settings, performedByUserId, ownerUserIdForListingRuns } = input;
  const meta = action.metadataJson as Record<string, unknown>;

  const runListing = async (listingId: string | null | undefined) => {
    if (!listingId || !ownerUserIdForListingRuns) return { ok: false as const, error: "missing_listing_or_owner" };
    if (!(await listingOptAllowed(ownerUserIdForListingRuns))) {
      return { ok: false as const, error: "listing_autopilot_off" };
    }
    try {
      await runListingAutopilot({ listingId, performedByUserId });
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "run_failed" };
    }
  };

  switch (action.actionType) {
    case ACTION_PROMOTE_LISTING:
      if (!settings.autoPromoteTopListings) return { ok: false, detail: { skipped: "toggle" } };
      {
        const r = await runListing(action.listingId);
        return { ok: r.ok, detail: { type: action.actionType, error: "error" in r ? r.error : undefined } };
      }
    case ACTION_GENERATE_CONTENT:
    case ACTION_TRIGGER_LISTING_OPT:
    case ACTION_IMPROVE_CONVERSION:
      if (!settings.autoGenerateRevenueActions) return { ok: false, detail: { skipped: "toggle" } };
      {
        const r = await runListing(action.listingId);
        return { ok: r.ok, detail: { type: action.actionType, error: "error" in r ? r.error : undefined } };
      }
    case ACTION_SUGGEST_PRICE_REVIEW:
      if (!settings.allowPriceRecommendations) return { ok: false, detail: { skipped: "price_toggle" } };
      {
        const r = await runListing(action.listingId);
        return { ok: r.ok, detail: { type: "price_review_suggestions_only", error: "error" in r ? r.error : undefined } };
      }
    case ACTION_UPSELL_FEATURED:
    case ACTION_RECOVER_ABANDONED:
    case ACTION_BROKER_FOLLOWUP:
      await logRevenueAutopilotEvent({
        scopeType: action.scopeType,
        scopeId: action.scopeId,
        actionType: `guidance_${action.actionType}`,
        performedByUserId,
        hostId: ownerUserIdForListingRuns,
        outputPayload: { actionId: action.id, meta },
      });
      return { ok: true, detail: { guidance: true } };
    case ACTION_TRIGGER_PORTFOLIO:
      if (!ownerUserIdForListingRuns) return { ok: false, detail: { skipped: "no_owner" } };
      try {
        await runPortfolioAutopilot({
          ownerUserId: ownerUserIdForListingRuns,
          performedByUserId,
        });
        return { ok: true, detail: { portfolioRun: true } };
      } catch (e) {
        return { ok: false, detail: { error: e instanceof Error ? e.message : "portfolio_failed" } };
      }
    default:
      return { ok: false, detail: { unknown: action.actionType } };
  }
}

export async function applySafeRevenueActions(input: {
  scopeType: "owner" | "platform";
  scopeId: string;
  performedByUserId: string | null;
}): Promise<{ processed: number }> {
  const settings = await getOrCreateRevenueAutopilotSettings(input.scopeType, input.scopeId);
  if (!revenueSafeAutoEnabled(settings.mode)) {
    return { processed: 0 };
  }

  const actionsRaw = await prisma.revenueAutopilotAction.findMany({
    where: {
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      status: "suggested",
    },
    orderBy: { createdAt: "asc" },
  });
  const prRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const actions = [...actionsRaw].sort((a, b) => prRank[a.priority] - prRank[b.priority]);

  let processed = 0;
  const ownerForRuns = input.scopeType === "owner" ? input.scopeId : null;

  for (const action of actions) {
    if (input.scopeType === "platform") {
      await logRevenueAutopilotEvent({
        scopeType: action.scopeType,
        scopeId: action.scopeId,
        actionType: "platform_safe_apply_skipped_automation",
        performedByUserId: input.performedByUserId,
        outputPayload: { actionId: action.id, actionType: action.actionType },
        explanation: "Platform scope does not auto-run host listing changes in MVP.",
      });
      await prisma.revenueAutopilotAction.update({
        where: { id: action.id },
        data: { status: "applied" },
      });
      processed += 1;
      continue;
    }

    const result = await executeRevenueActionDownstream({
      action,
      settings,
      performedByUserId: input.performedByUserId,
      ownerUserIdForListingRuns: ownerForRuns,
    });
    if (result.ok) {
      await prisma.revenueAutopilotAction.update({
        where: { id: action.id },
        data: { status: "applied" },
      });
      processed += 1;
    }
  }

  await logRevenueAutopilotEvent({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    actionType: "safe_apply_completed",
    performedByUserId: input.performedByUserId,
    outputPayload: { processed },
  });

  return { processed };
}
