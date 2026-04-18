import {
  getLastAdsAutomationLoopRun,
  type AdsAutomationLoopResult,
  type AdsAutomationRecommendationRow,
} from "@/modules/ads/ads-automation-loop.service";
import { registerDecision } from "../platform-core.service";
import type { CreateDecisionInput } from "../platform-core.repository";

function buildTitle(rec: AdsAutomationRecommendationRow): string {
  const t = rec.recommendationType.replace(/_/g, " ");
  return rec.targetKey ? `${t} — ${rec.targetKey}` : t;
}

function buildSummary(rec: AdsAutomationRecommendationRow): string {
  return rec.reasons.slice(0, 2).join(" · ") || rec.operatorAction;
}

function recommendationToCreateInput(
  rec: AdsAutomationRecommendationRow,
  run: AdsAutomationLoopResult,
  learningSignalLines: string[] | undefined,
): CreateDecisionInput {
  const loopId = run.loopRunId ?? "memory";
  const dedupeKey = `${loopId}:${rec.recommendationType}:${rec.targetKey ?? "global"}`;
  const geo = rec.metadata && typeof rec.metadata === "object" ? (rec.metadata as Record<string, unknown>).geo : null;

  return {
    source: "ADS",
    entityType: "CAMPAIGN",
    entityId: rec.targetKey ?? null,
    title: buildTitle(rec),
    summary: buildSummary(rec),
    reason: rec.reasons.join(" "),
    confidenceScore: rec.confidence ?? 0.3,
    evidenceScore: rec.evidenceScore ?? null,
    status: "PENDING",
    actionType: rec.recommendationType,
    expectedImpact:
      rec.metadata && typeof rec.metadata === "object" && "expectedOutcome" in rec.metadata ?
        String((rec.metadata as Record<string, unknown>).expectedOutcome ?? "")
      : rec.operatorAction,
    warnings: [],
    blockers: [],
    metadata: {
      loopId: run.loopRunId,
      geo: geo ?? null,
      learningSignals: learningSignalLines?.length ? learningSignalLines : null,
      persistenceStatus: run.persistenceStatus,
      adsOperatorAction: rec.operatorAction,
      priority: rec.priority,
      adsIngestDedupeKey: dedupeKey,
    },
  };
}

export async function ingestAdsV4RunToPlatformCore(
  run?: AdsAutomationLoopResult | null,
  learningSignalLines?: string[],
): Promise<{ ingested: number }> {
  const r = run ?? getLastAdsAutomationLoopRun();
  if (!r?.recommendations?.length) return { ingested: 0 };

  let count = 0;
  for (const rec of r.recommendations) {
    await registerDecision(recommendationToCreateInput(rec, r, learningSignalLines));
    count++;
  }

  return { ingested: count };
}
