import type { StrategyBenchmarkDomain, StrategyBucketOutcome } from "@prisma/client";
import { prisma } from "@repo/db";
import type { AttributedStrategy } from "./strategy-attribution.engine";
import { strategyBenchmarkLog } from "./strategy-benchmark-logger";

/**
 * Apply fractional outcome credit to each aggregate row. Uses soft float scores (not deterministic win claims).
 */
export async function updateAggregatesForOutcome(
  attributed: AttributedStrategy[],
  outcome: StrategyBucketOutcome,
  closingTimeDays: number | null
): Promise<void> {
  for (const a of attributed) {
    try {
      if (a.contributionWeight <= 0) continue;
      const w = a.contributionWeight;
      const winDelta = outcome === "WON" ? w : 0;
      const lossDelta = outcome === "LOST" ? w : 0;
      const stallDelta = outcome === "STALLED" ? w : 0;
      const existing = await prisma.strategyPerformanceAggregate.findUnique({
        where: { strategyKey_domain: { strategyKey: a.strategyKey, domain: a.domain } },
      });
      let avg = existing?.avgClosingTime ?? null;
      let samples = existing?.closingSamples ?? 0;
      if (typeof closingTimeDays === "number" && closingTimeDays >= 0 && (outcome === "WON" || outcome === "LOST")) {
        const n = samples + w;
        avg = avg == null ? closingTimeDays : (avg * samples + closingTimeDays * w) / Math.max(n, 0.0001);
        samples = Math.round(n);
      }
      await prisma.strategyPerformanceAggregate.upsert({
        where: { strategyKey_domain: { strategyKey: a.strategyKey, domain: a.domain } },
        create: {
          strategyKey: a.strategyKey,
          domain: a.domain,
          totalUses: 0,
          wins: winDelta,
          losses: lossDelta,
          stalls: stallDelta,
          avgClosingTime: avg,
          closingSamples: samples,
        },
        update: {
          wins: { increment: winDelta },
          losses: { increment: lossDelta },
          stalls: { increment: stallDelta },
          ...(typeof closingTimeDays === "number" && closingTimeDays >= 0 && (outcome === "WON" || outcome === "LOST")
            ? { avgClosingTime: avg, closingSamples: samples }
            : {}),
        },
      });
      strategyBenchmarkLog.performance({ strategyKey: a.strategyKey, domain: a.domain, outcome, w });
    } catch (e) {
      strategyBenchmarkLog.warn("updateAggregatesForOutcome", { err: e instanceof Error ? e.message : String(e) });
    }
  }
}

/**
 * @deprecated use updateAggregatesForOutcome; kept for tests naming alignment.
 */
export async function updateStrategyPerformance(
  strategyKey: string,
  domain: StrategyBenchmarkDomain,
  outcome: StrategyBucketOutcome,
  weight: number,
  closingTimeDays: number | null
): Promise<void> {
  await updateAggregatesForOutcome([{ strategyKey, domain, contributionWeight: weight }], outcome, closingTimeDays);
}
