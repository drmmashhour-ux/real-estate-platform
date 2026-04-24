import type { MemoryPlaybook, MemoryDomain, PlaybookExecutionMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { playbookMemoryRecommendationService } from "./playbook-memory-recommendation.service";
import { playbookLog } from "../playbook-memory.logger";
import { playbookTelemetry } from "../playbook-memory.telemetry";
import * as repo from "../repository/playbook-memory.repository";
import type {
  PlaybookComparableContext,
  PlaybookOrMemoryRecommendation,
  RecommendationRequestContext,
  RetrievalContextInput,
} from "../types/playbook-memory.types";
import {
  buildMarketKey,
  buildSegmentKey,
  buildSimilarityFingerprint,
} from "../utils/playbook-memory-fingerprint";
import {
  computeFinalScore,
  computeRecencyScore,
  computeSimilarityScore,
  confidenceFromExecutionStats,
  hybridCandidateScore,
} from "../utils/playbook-memory-score";
import { buildRationale } from "../utils/playbook-memory-rationale";

const PB = "[playbook]";

function mapHintToRequestAutonomy(
  autonomyMode: RecommendationRequestContext["autonomyMode"] | undefined,
  hint: PlaybookExecutionMode | undefined,
): RecommendationRequestContext["autonomyMode"] | undefined {
  if (autonomyMode != null) return autonomyMode;
  if (hint == null) return undefined;
  if (hint === "HUMAN_APPROVAL") return "ASSIST";
  if (hint === "RECOMMEND_ONLY") return "OFF";
  if (hint === "SAFE_AUTOPILOT" || hint === "FULL_AUTOPILOT") return hint;
  return undefined;
}

function toRecommendationRequestContext(input: RetrievalContextInput): RecommendationRequestContext {
  const c = input.context;
  return {
    domain: c.domain as RecommendationRequestContext["domain"],
    entityType: c.entityType,
    market: c.market as unknown as Record<string, string | number | boolean | null> | undefined,
    segment: c.segment as unknown as Record<string, string | number | boolean | null> | undefined,
    signals: c.signals,
    policyFlags: input.policyFlags,
    autonomyMode: mapHintToRequestAutonomy(input.autonomyMode, input.autonomyModeHint),
    candidatePlaybookIds: input.candidatePlaybookIds,
  };
}

function recencyScoreFromDate(d: Date | null | undefined): number {
  if (!d) return 0.2;
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days <= 7) return 1;
  if (days <= 30) return 0.7;
  if (days <= 90) return 0.45;
  return 0.25;
}

function performanceScoreFromPlaybook(p: MemoryPlaybook): number {
  const t = p.totalExecutions;
  if (t === 0) return 0.1;
  const wr = p.successfulExecutions / t;
  const band =
    p.scoreBand === "ELITE" ? 1 : p.scoreBand === "HIGH" ? 0.8 : p.scoreBand === "MEDIUM" ? 0.55 : 0.3;
  return Math.min(1, (wr * 0.6 + band * 0.4) * 1.0);
}

export async function findSimilarMemories(
  context: PlaybookComparableContext,
  take = 20,
) {
  const fp = buildSimilarityFingerprint(context);
  const segmentKey = buildSegmentKey(context);
  const marketKey = buildMarketKey(context);
  return repo.findSimilarMemories({
    domain: context.domain,
    fingerprint: fp,
    segmentKey,
    marketKey,
    take,
  });
}

export async function findCandidatePlaybooks(
  context: PlaybookComparableContext,
  candidatePlaybookIds?: string[],
) {
  const all = await repo.listActiveMemoryPlaybooks(context.domain);
  if (!candidatePlaybookIds?.length) return all;
  const set = new Set(candidatePlaybookIds);
  return all.filter((p) => set.has(p.id));
}

export function rankPlaybooks(
  context: PlaybookComparableContext,
  playbooks: (MemoryPlaybook & { currentVersion: { id: string } | null })[],
): Array<{ playbook: MemoryPlaybook; score: number }> {
  const fp = buildSimilarityFingerprint(context);
  const scored = playbooks.map((p) => {
    const perf = performanceScoreFromPlaybook(p);
    const simHint =
      Array.isArray(p.segmentScope) || p.segmentScope
        ? 0.55
        : p.marketScope
          ? 0.55
          : 0.35;
    const similarityScore = Math.min(1, simHint + (p.tags?.length ? 0.05 : 0));
    const contextMatch =
      p.domain === context.domain ? 0.85 : 0.2;
    const recency = recencyScoreFromDate(p.lastExecutedAt);
    const conf = confidenceFromExecutionStats(p.totalExecutions);
    const candidateScore = hybridCandidateScore({
      similarityScore,
      playbookPerformanceScore: perf,
      contextMatchScore: contextMatch,
      recencyScore: recency,
      confidenceScore: conf,
    });
    return { playbook: p, score: candidateScore };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export type RecommendationsWithSource = {
  recommendations: PlaybookOrMemoryRecommendation[];
  source: "playbook_first" | "memory_fallback" | "none";
};

export async function getRecommendationsWithSource(input: RetrievalContextInput): Promise<RecommendationsWithSource> {
  playbookTelemetry.evaluationsCount += 1;
  try {
    const req = toRecommendationRequestContext(input);
    const playbookRecs = await playbookMemoryRecommendationService.getPlaybookRecommendations(req);
    if (playbookRecs.length > 0) {
      for (const r of playbookRecs) {
        if (!r.allowed) {
          playbookTelemetry.blockedCount += 1;
        }
      }
      playbookTelemetry.recommendationsCount += playbookRecs.length;
      playbookLog.info("getRecommendationsWithSource", {
        source: "playbook_first",
        count: playbookRecs.length,
        domain: input.context.domain,
      });
      // eslint-disable-next-line no-console -- [playbook] source annotation
      console.log(PB, "recommendation_source", { source: "playbook_first", domain: input.context.domain, count: playbookRecs.length });
      return { recommendations: playbookRecs, source: "playbook_first" };
    }
  } catch (e) {
    playbookLog.error("getRecommendationsWithSource playbook path failed", {
      message: e instanceof Error ? e.message : String(e),
    });
  }

  const memRaw = await playbookMemoryRetrievalService.getRecommendations(input.context);
  if (memRaw.length === 0) {
    playbookLog.info("getRecommendationsWithSource", {
      source: "none",
      domain: input.context.domain,
    });
    // eslint-disable-next-line no-console
    console.log(PB, "recommendation_source", { source: "none", domain: input.context.domain, count: 0 });
    return { recommendations: [], source: "none" };
  }

  const withType = memRaw.map<PlaybookOrMemoryRecommendation>((m) => ({
    itemType: "memory" as const,
    memoryId: m.memoryId,
    actionType: m.actionType,
    score: m.score,
    confidence: m.confidence,
    rationale: m.rationale,
    allowed: m.allowed,
    blockedReasons: m.blockedReasons,
  }));
  playbookTelemetry.recommendationsCount += withType.length;
  playbookLog.info("getRecommendationsWithSource", {
    source: "memory_fallback",
    count: withType.length,
    domain: input.context.domain,
  });
  // eslint-disable-next-line no-console
  console.log(PB, "recommendation_source", { source: "memory_fallback", domain: input.context.domain, count: withType.length });
  return { recommendations: withType, source: "memory_fallback" };
}

/** Wave 7: playbook-first, then `PlaybookMemoryRecord` history. */
export async function getRecommendations(input: RetrievalContextInput): Promise<PlaybookOrMemoryRecommendation[]> {
  const { recommendations } = await getRecommendationsWithSource(input);
  return recommendations;
}

export type MemoryRecordRecommendation = {
  memoryId: string;
  actionType: string;
  score: number;
  confidence: number;
  rationale: string[];
  allowed: boolean;
  blockedReasons: string[];
};

/**
 * Wave 3: ranked hints from `PlaybookMemoryRecord` only (SUCCEEDED outcomes), no `MemoryPlaybook` reads.
 * Read path; never throws — returns `[]` on any failure.
 */
export const playbookMemoryRetrievalService = {
  async getRecommendations(context: unknown): Promise<MemoryRecordRecommendation[]> {
    try {
      if (context === null || typeof context !== "object") {
        return [];
      }
      const c = context as { domain?: MemoryDomain; segment?: Record<string, unknown> | null };
      if (c.domain === undefined || c.domain === null) {
        return [];
      }

      const records = await prisma.playbookMemoryRecord.findMany({
        where: {
          domain: c.domain,
          outcomeStatus: "SUCCEEDED",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const segA = c.segment ?? {};
      const results = records.map((r) => {
        const snap = r.contextSnapshot as { segment?: Record<string, unknown> } | null;
        const segB = snap?.segment ?? {};
        const similarity = computeSimilarityScore(segA, segB);
        const recency = computeRecencyScore(r.createdAt);
        const score = computeFinalScore({ similarity, recency });
        return {
          id: r.id,
          actionType: r.actionType,
          score,
          similarity,
          recency,
          rationale: buildRationale({ similarity, recency }),
        };
      });

      const sorted = results.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.id.localeCompare(b.id);
      });

      // eslint-disable-next-line no-console -- Wave 3 ops visibility
      console.log(PB, "memory_recommendations_retrieved", { count: sorted.length, domain: c.domain });
      return sorted.slice(0, 5).map((r) => ({
        memoryId: r.id,
        actionType: r.actionType,
        score: r.score,
        confidence: r.score,
        rationale: r.rationale,
        allowed: true,
        blockedReasons: [] as string[],
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(PB, "retrieval_failed", error);
      return [];
    }
  },
};
