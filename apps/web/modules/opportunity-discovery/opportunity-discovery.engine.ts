import { mergeWeights } from "./opportunity-scoring";
import { buildOpportunityDiscoveryContext } from "./opportunity-context.service";
import { runBrokerOpportunityEngine } from "./broker-opportunity.engine";
import { runEsgOpportunityEngine } from "./esg-opportunity.engine";
import { runInvestmentUpsideEngine } from "./investment-upside.engine";
import { runShortTermArbitrageEngine } from "./short-term-arbitrage.engine";
import { runUndervaluedListingEngine } from "./undervalued-listing.engine";
import type { DiscoveredOpportunity, OpportunityDiscoveryOptions } from "./opportunity.types";
import { persistDiscoveredOpportunities } from "./opportunity-persistence.service";
import type { LecipmOpportunityKind } from "@prisma/client";

function dedupeOpportunities(rows: DiscoveredOpportunity[]): DiscoveredOpportunity[] {
  const map = new Map<string, DiscoveredOpportunity>();
  for (const r of rows) {
    const k = `${r.entityType}:${r.entityId}:${r.opportunityType}`;
    const prev = map.get(k);
    if (!prev || prev.score < r.score) map.set(k, r);
  }
  return [...map.values()].sort((a, b) => b.score - a.score);
}

function groupByType(rows: DiscoveredOpportunity[]): Record<string, DiscoveredOpportunity[]> {
  const out: Partial<Record<LecipmOpportunityKind, DiscoveredOpportunity[]>> = {};
  for (const r of rows) {
    const arr = out[r.opportunityType] ?? [];
    arr.push(r);
    out[r.opportunityType] = arr;
  }
  return out as Record<string, DiscoveredOpportunity[]>;
}

/**
 * Recommendation-only discovery — surfaces explainable candidates; never executes trades or sends outreach.
 */
export async function discoverOpportunities(
  options: OpportunityDiscoveryOptions & { actorUserId?: string | null },
): Promise<{
  opportunities: DiscoveredOpportunity[];
  byType: Record<string, DiscoveredOpportunity[]>;
  persisted?: number;
}> {
  const ctx = await buildOpportunityDiscoveryContext(options.brokerUserId);
  const weights = mergeWeights(options.weights);

  let intentBoost = options.intentBoost ?? 0;
  if (intentBoost === 0 && ctx.leads.some((l) => l.aiTier === "hot" && l.score >= 70)) {
    intentBoost = 0.25;
  }

  const u = runUndervaluedListingEngine(ctx, weights);
  const inv = runInvestmentUpsideEngine(ctx, weights);
  const e = runEsgOpportunityEngine(ctx, weights);
  const s = runShortTermArbitrageEngine(ctx, weights);
  const b = runBrokerOpportunityEngine(ctx, weights, intentBoost);

  const opportunities = dedupeOpportunities([...u, ...inv, ...e, ...s, ...b]);
  const byType = groupByType(opportunities);

  let persisted: number | undefined;
  if (options.persist) {
    const r = await persistDiscoveredOpportunities(options.brokerUserId, opportunities, options.actorUserId ?? options.brokerUserId);
    persisted = r.upserted;
  }

  return { opportunities, byType, persisted };
}
