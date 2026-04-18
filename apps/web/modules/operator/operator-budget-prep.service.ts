/**
 * Deterministic budget prep for Operator V2 — maps SCALE/PAUSE recommendations to sync payloads.
 * Uses manual spend aggregation for current budget; requires DB provider mapping for outbound identity.
 */
import { getManualSpendAggregatedForAdsWindow } from "@/modules/ads/growth-ops-manual-spend.service";
import type { AssistantRecommendation } from "./operator.types";
import { isExternallySyncableBudgetAction } from "./operator-execution.types";
import type { OperatorCampaignProviderLink } from "@prisma/client";
import type { BudgetExecutionAction, BudgetSyncPayload, ExternalAdProvider, ProviderCampaignMapping } from "./operator-v2.types";
import * as syncRepo from "./operator-external-sync.repository";

const RANGE_DAYS = 14;
const DEFAULT_CURRENCY = "CAD";
/** Default +15% scale step; further limited by guardrails (±30% cap). */
const SCALE_MULTIPLIER = 1.15;
/** Pause-prep: reduce toward pause without exceeding -30% in one step when current > 0. */
const PAUSE_PREP_MULTIPLIER = 0.7;
const MIN_BUDGET_FLOOR = 5;

function campaignKey(rec: AssistantRecommendation): string | null {
  const m = rec.metrics;
  if (m && typeof m.campaignKey === "string" && m.campaignKey.trim()) return m.campaignKey.trim();
  if (m && typeof m.campaignId === "string" && m.campaignId.trim()) return m.campaignId.trim();
  return rec.targetId?.trim() ?? null;
}

function parseProviderHint(rec: AssistantRecommendation): ExternalAdProvider | null {
  const m = rec.metrics;
  const raw = m?.provider ?? m?.adProvider;
  if (typeof raw !== "string") return null;
  const u = raw.toUpperCase();
  if (u === "META" || u === "FACEBOOK") return "META";
  if (u === "GOOGLE" || u === "GOOGLE_ADS") return "GOOGLE";
  return null;
}

function rowToMapping(row: OperatorCampaignProviderLink | null): ProviderCampaignMapping | null {
  if (!row) return null;
  const p = row.provider.toUpperCase();
  if (p !== "META" && p !== "GOOGLE") return null;
  const provider = p as ExternalAdProvider;
  const meta = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : undefined;
  return {
    campaignId: row.campaignId,
    provider,
    externalCampaignId: row.externalCampaignId,
    status: row.status,
    metadata: meta,
  };
}

/**
 * Resolves Meta/Google link for a campaign. Prefers an explicit metrics hint when present.
 */
export async function resolveProviderCampaignMapping(
  campaignId: string,
  preferred?: ExternalAdProvider | null,
): Promise<ProviderCampaignMapping | null> {
  if (preferred === "META") {
    const row = await syncRepo.getCampaignProviderLink(campaignId, "META");
    return rowToMapping(row);
  }
  if (preferred === "GOOGLE") {
    const row = await syncRepo.getCampaignProviderLink(campaignId, "GOOGLE");
    return rowToMapping(row);
  }
  const meta = await syncRepo.getCampaignProviderLink(campaignId, "META");
  const m = rowToMapping(meta);
  if (m) return m;
  const google = await syncRepo.getCampaignProviderLink(campaignId, "GOOGLE");
  return rowToMapping(google);
}

/**
 * Deterministic proposed budget from recommendation action. Does not apply guardrail caps (see evaluateBudgetGuardrails).
 */
export function computeProposedBudgetFromRecommendation(
  actionType: AssistantRecommendation["actionType"],
  currentBudget: number,
): { proposedBudget: number; executionAction: BudgetExecutionAction } {
  const base = Math.max(currentBudget, 0);

  if (actionType === "SCALE_CAMPAIGN") {
    const baseline = base > 0 ? base : MIN_BUDGET_FLOOR;
    return {
      proposedBudget: Number((baseline * SCALE_MULTIPLIER).toFixed(2)),
      executionAction: "SYNC_CAMPAIGN_BUDGET_INCREASE",
    };
  }

  if (actionType === "PAUSE_CAMPAIGN") {
    const baseline = base > 0 ? base : MIN_BUDGET_FLOOR;
    const stepped = Math.max(MIN_BUDGET_FLOOR, baseline * PAUSE_PREP_MULTIPLIER);
    return {
      proposedBudget: Number(stepped.toFixed(2)),
      executionAction: "SYNC_CAMPAIGN_PAUSE_PREP",
    };
  }

  return {
    proposedBudget: Number(base.toFixed(2)),
    executionAction: "SYNC_CAMPAIGN_BUDGET_INCREASE",
  };
}

export type BudgetPrepResult =
  | {
      ok: true;
      payload: BudgetSyncPayload;
      mapping: ProviderCampaignMapping;
      executionAction: BudgetExecutionAction;
    }
  | { ok: false; blockingReasons: string[]; warnings?: string[] };

/**
 * Builds a {@link BudgetSyncPayload} from a persisted assistant recommendation.
 */
export async function buildBudgetSyncPayloadFromRecommendation(
  rec: AssistantRecommendation,
): Promise<BudgetPrepResult> {
  if (!isExternallySyncableBudgetAction(rec.actionType)) {
    return { ok: false, blockingReasons: ["Action type is not eligible for external budget sync (V2)."] };
  }

  const campaignId = campaignKey(rec);
  if (!campaignId) {
    return { ok: false, blockingReasons: ["Missing campaign identifier (targetId / metrics.campaignKey)."] };
  }

  const spendAgg = await getManualSpendAggregatedForAdsWindow(RANGE_DAYS, 0);
  const currentBudget = spendAgg.byCampaign[campaignId] ?? 0;

  const { proposedBudget: rawProposed, executionAction } = computeProposedBudgetFromRecommendation(
    rec.actionType,
    currentBudget,
  );

  const hint = parseProviderHint(rec);
  const mapping = await resolveProviderCampaignMapping(campaignId, hint);
  if (!mapping) {
    return {
      ok: false,
      blockingReasons: [
        "No provider mapping for this campaign. Upsert Meta or Google `externalCampaignId` in Operator provider links.",
      ],
    };
  }

  const payload: BudgetSyncPayload = {
    campaignId,
    provider: mapping.provider,
    externalCampaignId: mapping.externalCampaignId,
    currentBudget,
    proposedBudget: rawProposed,
    currency: DEFAULT_CURRENCY,
    reason: rec.reason,
    sourceRecommendationId: rec.id,
    executionAction,
  };

  return { ok: true, payload, mapping, executionAction };
}
