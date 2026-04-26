import type { StrategyBucketOutcome } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { strategyBenchmarkLog } from "./strategy-benchmark-logger";
import { attributeOutcomeToStrategies } from "./strategy-attribution.engine";
import { updateAggregatesForOutcome } from "./performance-aggregator.service";
import { recordStrategyOutcomeFeedback } from "@/modules/reinforcement/feedback.service";

export type DealLike = {
  id: string;
  status: string;
  crmStage?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Map platform deal to coarse outcome bucket. Does not assert legal close quality.
 */
export function mapDealToStrategyOutcome(
  deal: Pick<DealLike, "status" | "crmStage">
): StrategyBucketOutcome | null {
  if (deal.status === "closed") return "WON";
  if (deal.status === "cancelled") return "LOST";
  const s = (deal.crmStage ?? "").toLowerCase();
  if (/\b(stalled|on-hold|on hold|dormant|stuck)\b/i.test(s)) return "STALLED";
  return null;
}

/**
 * Store outcome + run attribution + aggregate (probabilistic learning, not a claim on any single user).
 */
export async function trackDealOutcome(deal: DealLike): Promise<void> {
  try {
    const outcome = mapDealToStrategyOutcome(deal);
    if (!outcome) return;
    const days = (deal.updatedAt.getTime() - deal.createdAt.getTime()) / 86_400_000;
    const closingTimeDays = Number.isFinite(days) && days >= 0 ? days : null;
    const before = await prisma.strategyOutcomeEvent.findUnique({ where: { dealId: deal.id } });
    if (before) return;
    await prisma.strategyOutcomeEvent.create({
      data: {
        dealId: deal.id,
        outcome,
        closingTimeDays: closingTimeDays ?? undefined,
        finalStage: deal.crmStage ?? deal.status,
      },
    });
    strategyBenchmarkLog.outcome({ dealId: deal.id, outcome, first: true });
    const { attributedStrategies } = await attributeOutcomeToStrategies(deal.id, outcome, closingTimeDays);
    await updateAggregatesForOutcome(attributedStrategies, outcome, closingTimeDays);
    void recordStrategyOutcomeFeedback({
      dealId: deal.id,
      outcome,
      closingTimeDays,
    }).catch(() => undefined);
  } catch (e) {
    strategyBenchmarkLog.warn("trackDealOutcome", { err: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Entry point: load deal and record strategy outcome. Never throws. Idempotent.
 */
export async function syncStrategyOutcomeForDealId(dealId: string): Promise<void> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, status: true, crmStage: true, createdAt: true, updatedAt: true },
    });
    if (!deal) return;
    if (mapDealToStrategyOutcome(deal) == null) return;
    await trackDealOutcome(deal);
  } catch (e) {
    strategyBenchmarkLog.warn("syncStrategyOutcomeForDealId", { err: e instanceof Error ? e.message : String(e) });
  }
}
