import type { StrategyBenchmarkDomain, StrategyBucketOutcome } from "@prisma/client";
import { prisma } from "@repo/db";
import { strategyBenchmarkLog } from "./strategy-benchmark-logger";

const SEP = "\t";

export type AttributedStrategy = {
  strategyKey: string;
  domain: StrategyBenchmarkDomain;
  contributionWeight: number;
};

const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Weights past strategy uses by recency and proximity to deal end (heuristic, explainable; not a causal claim).
 */
export async function attributeOutcomeToStrategies(
  dealId: string,
  _outcome: StrategyBucketOutcome,
  closingTimeDays: number | null
): Promise<{ attributedStrategies: AttributedStrategy[] }> {
  try {
    const events = await prisma.strategyExecutionEvent.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
    });
    if (events.length === 0) {
      strategyBenchmarkLog.attribution({ dealId, n: 0 });
      return { attributedStrategies: [] };
    }
    const lastT = events[events.length - 1]!.createdAt.getTime();
    const endHintMs =
      typeof closingTimeDays === "number" && closingTimeDays > 0 ? closingTimeDays * 86_400_000 : null;

    const contribution: { key: string; domain: StrategyBenchmarkDomain; strategyKey: string; w: number }[] = [];
    for (const e of events) {
      const age = lastT - e.createdAt.getTime();
      const rec = Math.exp(-age / HALF_LIFE_MS);
      let near = 0.5;
      if (endHintMs != null) {
        const span = lastT - e.createdAt.getTime();
        near = 0.5 + 0.5 * (1 - Math.min(1, span / Math.max(endHintMs, 1)));
      }
      const w = rec * near + 0.1;
      const k = e.domain + SEP + e.strategyKey;
      contribution.push({ key: k, domain: e.domain, strategyKey: e.strategyKey, w });
    }

    const byKey = new Map<string, number>();
    for (const c of contribution) {
      byKey.set(c.key, (byKey.get(c.key) ?? 0) + c.w);
    }
    const sumW = Array.from(byKey.values()).reduce((a, b) => a + b, 0) || 1;
    const attributedStrategies: AttributedStrategy[] = Array.from(byKey.entries()).map(([k, w]) => {
      const [dom, ...skParts] = k.split(SEP);
      return {
        domain: dom as StrategyBenchmarkDomain,
        strategyKey: skParts.join(SEP),
        contributionWeight: w / sumW,
      };
    });
    attributedStrategies.sort((a, b) => b.contributionWeight - a.contributionWeight);
    strategyBenchmarkLog.attribution({ dealId, n: attributedStrategies.length, top: attributedStrategies[0]?.strategyKey });
    return { attributedStrategies };
  } catch (e) {
    strategyBenchmarkLog.warn("attribution", { err: e instanceof Error ? e.message : String(e) });
    return { attributedStrategies: [] };
  }
}
