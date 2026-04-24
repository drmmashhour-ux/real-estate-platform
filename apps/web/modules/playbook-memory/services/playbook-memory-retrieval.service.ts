import type { MemoryPlaybook, PlaybookExecutionMode, MemoryDomain } from "@prisma/client";
import { prisma } from "@/lib/db";
import { evaluateRecommendationPolicy } from "./playbook-memory-policy-gate.service";
import { playbookLog } from "../playbook-memory.logger";
import { playbookTelemetry } from "../playbook-memory.telemetry";
import * as repo from "../repository/playbook-memory.repository";
import type { PlaybookComparableContext, PlaybookRecommendation, RetrievalContextInput } from "../types/playbook-memory.types";
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
import { buildRationale, buildRationaleLines } from "../utils/playbook-memory-rationale";

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

export async function getRecommendations(input: RetrievalContextInput): Promise<PlaybookRecommendation[]> {
  playbookTelemetry.evaluationsCount += 1;
  const candidates = await findCandidatePlaybooks(input.context, input.candidatePlaybookIds);
  const ranked = rankPlaybooks(input.context, candidates);
  const out: PlaybookRecommendation[] = [];

  for (const { playbook: p, score } of ranked.slice(0, 12)) {
    if (p.status === "PAUSED" || p.status === "ARCHIVED" || p.status === "DRAFT") {
      continue;
    }
    const versionId = p.currentVersionId;
    if (!versionId) {
      out.push({
        playbookId: p.id,
        playbookVersionId: "none",
        name: p.name,
        score,
        confidence: confidenceFromExecutionStats(p.totalExecutions),
        rationale: ["No active version linked — recommendation blocked."],
        executionMode: p.executionMode as PlaybookExecutionMode,
        allowed: false,
        blockedReasons: ["missing_current_version"],
      });
      continue;
    }

    const gate = evaluateRecommendationPolicy({
      playbook: p,
      context: input.context,
      policySnapshot: undefined,
      riskSnapshot: undefined,
      autonomyHint: input.autonomyModeHint,
    });

    const rationale = buildRationaleLines({
      rankScore: score,
      domain: p.domain,
      totalExecutions: p.totalExecutions,
      scoreBand: p.scoreBand,
      executionMode: p.executionMode,
    });

    const rec: PlaybookRecommendation = {
      playbookId: p.id,
      playbookVersionId: versionId,
      name: p.name,
      score,
      confidence: confidenceFromExecutionStats(p.totalExecutions),
      rationale,
      executionMode: p.executionMode as PlaybookExecutionMode,
      allowed: gate.allowed && p.status === "ACTIVE",
      blockedReasons: [...gate.blockedReasons],
    };

    if (!rec.allowed) {
      playbookTelemetry.blockedCount += 1;
    }

    out.push(rec);
    playbookTelemetry.recommendationsCount += 1;
  }

  playbookLog.info("getRecommendations", {
    count: out.length,
    domain: input.context.domain,
  });
  return out;
}

const PB = "[playbook]";

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
