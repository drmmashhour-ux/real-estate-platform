import type { StrategyBenchmarkDomain } from "@prisma/client";
import { prisma } from "@repo/db";
import { strategyBenchmarkLog } from "./strategy-benchmark-logger";

export type TrackStrategyExecutionParams = {
  strategyKey: string;
  domain: StrategyBenchmarkDomain;
  dealId?: string | null;
  conversationId?: string | null;
  brokerId?: string | null;
  clientId?: string | null;
  /** Product context only — no free-text PII. */
  contextSnapshot?: Record<string, unknown>;
};

/**
 * Records a strategy use (suggestion accepted, replay, or simulated path). Never throws.
 */
export async function trackStrategyExecution(params: TrackStrategyExecutionParams): Promise<{ ok: boolean; id?: string }> {
  try {
    const key = params.strategyKey.slice(0, 128);
    const row = await prisma.strategyExecutionEvent.create({
      data: {
        strategyKey: key,
        domain: params.domain,
        dealId: params.dealId ?? undefined,
        conversationId: params.conversationId ?? undefined,
        brokerId: params.brokerId ?? undefined,
        clientId: params.clientId ?? undefined,
        contextSnapshot: (params.contextSnapshot ?? { source: "track" }) as object,
      },
    });
    try {
      await prisma.strategyPerformanceAggregate.upsert({
        where: { strategyKey_domain: { strategyKey: key, domain: params.domain } },
        create: {
          strategyKey: key,
          domain: params.domain,
          totalUses: 1,
          wins: 0,
          losses: 0,
          stalls: 0,
          closingSamples: 0,
        },
        update: { totalUses: { increment: 1 } },
      });
    } catch {
      /* non-fatal; events table remains source of truth for usage */
    }
    strategyBenchmarkLog.execution({ strategyKey: key, domain: params.domain, dealId: params.dealId });
    return { ok: true, id: row.id };
  } catch (e) {
    strategyBenchmarkLog.warn("trackStrategyExecution", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false };
  }
}
