import { prisma } from "@repo/db";
import { attributeOutcomeToStrategies, type AttributedStrategy } from "./strategy-attribution.engine";
import type { StrategyBucketOutcome } from "@prisma/client";

/**
 * Deal-level strategy view for UI (no personal profiling; product events only).
 */
export async function getDealStrategyBenchmarkView(dealId: string): Promise<{
  executions: { id: string; strategyKey: string; domain: string; createdAt: string }[];
  outcome: { outcome: StrategyBucketOutcome; closingTimeDays: number | null } | null;
  attributed: { strategyKey: string; domain: string; contributionWeight: number }[];
  notes: string[];
}> {
  try {
    const [events, outcome] = await Promise.all([
      prisma.strategyExecutionEvent.findMany({
        where: { dealId },
        orderBy: { createdAt: "asc" },
        take: 80,
        select: { id: true, strategyKey: true, domain: true, createdAt: true },
      }),
      prisma.strategyOutcomeEvent.findUnique({ where: { dealId } }),
    ]);
    const hasOutcome = Boolean(outcome);
    const attr = hasOutcome
      ? await attributeOutcomeToStrategies(dealId, outcome!.outcome, outcome?.closingTimeDays ?? null).catch(
          (): { attributedStrategies: AttributedStrategy[] } => ({ attributedStrategies: [] })
        )
      : { attributedStrategies: [] as AttributedStrategy[] };
    const notes: string[] = [];
    if (outcome) {
      const denom = outcome.outcome === "WON" ? "positive terminal" : "non-won terminal";
      notes.push(
        `Recorded outcome is ${outcome.outcome} (${denom} in this benchmark — not a legal or financial statement).`
      );
    } else {
      notes.push("No terminal outcome recorded for this deal in the strategy benchmark yet.");
      if (events.length > 0) {
        notes.push("Execution events are still logged; attribution weights are shown only after a terminal bucket exists.");
      }
    }
    if (attr.attributedStrategies.length > 0) {
      notes.push("Attribution uses recency-weighted strategy events; weights are heuristic, not causal.");
    }
    return {
      executions: events.map((e) => ({
        id: e.id,
        strategyKey: e.strategyKey,
        domain: e.domain,
        createdAt: e.createdAt.toISOString(),
      })),
      outcome: outcome
        ? { outcome: outcome.outcome, closingTimeDays: outcome.closingTimeDays }
        : null,
      attributed: attr.attributedStrategies.map((a) => ({
        strategyKey: a.strategyKey,
        domain: a.domain,
        contributionWeight: Math.round(a.contributionWeight * 1000) / 1000,
      })),
      notes,
    };
  } catch {
    return { executions: [], outcome: null, attributed: [], notes: ["Strategy benchmark data unavailable."] };
  }
}
