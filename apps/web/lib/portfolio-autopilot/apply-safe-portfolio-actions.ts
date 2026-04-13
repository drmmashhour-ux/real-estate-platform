import type { PortfolioAutopilotAction, PortfolioAutopilotSetting } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runListingAutopilot } from "@/lib/autopilot/run-listing-autopilot";
import { getOrCreateListingAutopilotSettings } from "@/lib/autopilot/get-autopilot-settings";
import { getOrCreatePortfolioAutopilotSettings } from "./get-portfolio-settings";
import {
  ACTION_CONTENT_TOP,
  ACTION_OPTIMIZE_WEAK,
  ACTION_PRICING_REVIEW,
  ACTION_PROMOTE_CONVERTERS,
  ACTION_RESPONSE_TIME,
  ACTION_OPPORTUNITY_LISTING,
} from "./validators";
import { logPortfolioAutopilotEvent } from "./log-portfolio-event";

function listingIdsFromMeta(meta: unknown): string[] {
  if (!meta || typeof meta !== "object") return [];
  const m = meta as Record<string, unknown>;
  const raw = m.listingIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

async function listingOptimizationAllowed(ownerUserId: string): Promise<boolean> {
  const s = await getOrCreateListingAutopilotSettings(ownerUserId);
  return s.mode !== "off";
}

export async function triggerListingOptimizationRuns(input: {
  ownerUserId: string;
  listingIds: string[];
  performedByUserId: string | null;
  label: string;
}): Promise<{ listingId: string; ok: boolean; error?: string }[]> {
  const out: { listingId: string; ok: boolean; error?: string }[] = [];
  const allowed = await listingOptimizationAllowed(input.ownerUserId);
  if (!allowed) {
    for (const listingId of input.listingIds) {
      out.push({ listingId, ok: false, error: "Listing autopilot is off" });
    }
    return out;
  }
  for (const listingId of input.listingIds) {
    try {
      await runListingAutopilot({
        listingId,
        performedByUserId: input.performedByUserId,
      });
      out.push({ listingId, ok: true });
    } catch (e) {
      out.push({
        listingId,
        ok: false,
        error: e instanceof Error ? e.message : "run failed",
      });
    }
  }
  return out;
}

export async function executePortfolioActionDownstream(input: {
  action: PortfolioAutopilotAction;
  portfolioSettings: PortfolioAutopilotSetting;
  performedByUserId: string | null;
}): Promise<{ ok: boolean; detail?: Record<string, unknown> }> {
  const { action, portfolioSettings, performedByUserId } = input;
  const meta = action.metadataJson as Record<string, unknown>;
  const ownerUserId = action.ownerUserId;

  switch (action.actionType) {
    case ACTION_OPTIMIZE_WEAK: {
      if (!portfolioSettings.autoRunListingOptimization || !portfolioSettings.autoFlagWeakListings) {
        return { ok: false, detail: { skipped: "toggles_disabled" } };
      }
      const ids = listingIdsFromMeta(meta).slice(0, 5);
      const runs = await triggerListingOptimizationRuns({
        ownerUserId,
        listingIds: ids,
        performedByUserId,
        label: ACTION_OPTIMIZE_WEAK,
      });
      await logPortfolioAutopilotEvent({
        ownerUserId,
        actionType: "portfolio_action_listing_runs",
        performedByUserId,
        outputPayload: { actionId: action.id, actionType: action.actionType, runs },
      });
      return { ok: runs.some((r) => r.ok), detail: { runs } };
    }
    case ACTION_CONTENT_TOP: {
      if (!portfolioSettings.autoGenerateContentForTopListings) {
        return { ok: false, detail: { skipped: "toggles_disabled" } };
      }
      const ids = listingIdsFromMeta(meta).slice(0, 3);
      const runs = await triggerListingOptimizationRuns({
        ownerUserId,
        listingIds: ids,
        performedByUserId,
        label: ACTION_CONTENT_TOP,
      });
      await logPortfolioAutopilotEvent({
        ownerUserId,
        actionType: "portfolio_action_listing_runs",
        performedByUserId,
        outputPayload: { actionId: action.id, actionType: action.actionType, runs },
      });
      return { ok: runs.some((r) => r.ok), detail: { runs } };
    }
    case ACTION_PRICING_REVIEW: {
      if (!portfolioSettings.allowPriceRecommendations) {
        return { ok: false, detail: { skipped: "price_recommendations_disabled" } };
      }
      const ids = listingIdsFromMeta(meta).slice(0, 6);
      const runs = await triggerListingOptimizationRuns({
        ownerUserId,
        listingIds: ids,
        performedByUserId,
        label: ACTION_PRICING_REVIEW,
      });
      await logPortfolioAutopilotEvent({
        ownerUserId,
        actionType: "portfolio_action_pricing_runs",
        performedByUserId,
        outputPayload: { actionId: action.id, runs },
      });
      return { ok: runs.some((r) => r.ok), detail: { runs } };
    }
    case ACTION_RESPONSE_TIME:
    case ACTION_PROMOTE_CONVERTERS: {
      await logPortfolioAutopilotEvent({
        ownerUserId,
        actionType: "portfolio_action_guidance_only",
        performedByUserId,
        explanation: action.description,
        outputPayload: { actionId: action.id, actionType: action.actionType },
      });
      return { ok: true, detail: { guidance: true } };
    }
    case ACTION_OPPORTUNITY_LISTING: {
      if (!portfolioSettings.autoRunListingOptimization) {
        return { ok: false, detail: { skipped: "toggles_disabled" } };
      }
      const id = typeof meta.listingId === "string" ? meta.listingId : null;
      if (!id) return { ok: false, detail: { error: "missing_listing_id" } };
      const runs = await triggerListingOptimizationRuns({
        ownerUserId,
        listingIds: [id],
        performedByUserId,
        label: "opportunity",
      });
      await logPortfolioAutopilotEvent({
        ownerUserId,
        actionType: "portfolio_action_listing_runs",
        performedByUserId,
        outputPayload: { actionId: action.id, runs },
      });
      return { ok: runs.some((r) => r.ok), detail: { runs } };
    }
    default:
      return { ok: false, detail: { unknownType: action.actionType } };
  }
}

export async function applySafePortfolioActions(input: {
  ownerUserId: string;
  performedByUserId: string | null;
}): Promise<{ processed: number }> {
  const portfolioSettings = await getOrCreatePortfolioAutopilotSettings(input.ownerUserId);

  const actionsRaw = await prisma.portfolioAutopilotAction.findMany({
    where: { ownerUserId: input.ownerUserId, status: "suggested" },
    orderBy: { createdAt: "asc" },
  });
  const prRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const actions = [...actionsRaw].sort(
    (a, b) => prRank[a.priority] - prRank[b.priority] || a.createdAt.getTime() - b.createdAt.getTime()
  );

  let processed = 0;
  for (const action of actions) {
    const result = await executePortfolioActionDownstream({
      action,
      portfolioSettings,
      performedByUserId: input.performedByUserId,
    });
    if (result.ok) {
      await prisma.portfolioAutopilotAction.update({
        where: { id: action.id },
        data: { status: "applied" },
      });
      processed += 1;
    }
  }

  await logPortfolioAutopilotEvent({
    ownerUserId: input.ownerUserId,
    actionType: "portfolio_safe_apply_completed",
    performedByUserId: input.performedByUserId,
    outputPayload: { processed },
  });

  return { processed };
}
