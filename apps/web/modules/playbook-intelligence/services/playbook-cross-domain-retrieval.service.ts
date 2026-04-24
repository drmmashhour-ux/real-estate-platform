import type { MemoryDomain, MemoryPlaybook } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getEligibleRecommendationCandidates } from "@/modules/playbook-memory/services/playbook-memory-recommendation.service";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { PlaybookRecommendation, RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import { computeJsonFeatureFit, computeSharedFeatureFit } from "../utils/playbook-shared-score";
import { computeCrossDomainCompatibility, computeCrossDomainRecommendationScore, computeTransferPenalty } from "../utils/playbook-transfer-score";
import { evaluateTransferEligibility } from "./playbook-transfer-governor.service";
import { playbookSharedContextService } from "./playbook-shared-context.service";
import type { CrossDomainCandidate, CrossDomainRecommendationResult, SharedContextRepresentation } from "../shared/shared-context.types";
import { buildSharedSignature } from "../shared/shared-context-signature";
import { normalizeSharedContext } from "../shared/shared-context-normalize";
import { computeRiskPenalty } from "@/modules/playbook-memory/utils/playbook-memory-recommendation";

const TARGETS: MemoryDomain[] = [
  "GROWTH",
  "LISTINGS",
  "DREAM_HOME",
  "LEADS",
  "BROKER_ROUTING",
  "PROMOTIONS",
  "DEALS",
  "PRICING",
];

function toPlaybookForFit(p: MemoryPlaybook): Record<string, string | number | boolean | null> {
  return { ...normalizeSharedContext(p.segmentScope), ...normalizeSharedContext(p.marketScope) };
}

export const playbookCrossDomainRetrievalService = {
  /**
   * Native (same domain) from recommendation engine + transfer-gated other-domain playbooks.
   */
  async getCrossDomainCandidates(params: {
    request: RecommendationRequestContext;
    requestShared: SharedContextRepresentation | null;
    maxCrossPerDomain?: number;
  }): Promise<CrossDomainRecommendationResult> {
    const { request, requestShared } = params;
    const maxC = Math.min(12, Math.max(1, params.maxCrossPerDomain ?? 5));
    try {
      const requestDomain = request.domain as unknown as MemoryDomain;
      const native = (await getEligibleRecommendationCandidates(request, 24))?.filter(
        (r): r is PlaybookRecommendation => r.itemType === "playbook",
      ) ?? [];

      const requestSig = requestShared
        ? { ...requestShared.features, ...requestShared.explicitPreferences }
        : { ...normalizeSharedContext(request.segment), ...normalizeSharedContext(request.signals) };

      const indexSig = requestShared
        ? buildSharedSignature({ ...requestShared, features: requestSig } as unknown as Parameters<typeof buildSharedSignature>[0])
        : "";

      const cross: CrossDomainCandidate[] = [];
      const seenPlaybook = new Set<string>();
      for (const target of TARGETS) {
        if (target === requestDomain) {
          continue;
        }
        const tfr = evaluateTransferEligibility({ source: requestDomain, target });
        if (!tfr.allowed) {
          continue;
        }
        if (tfr.compatibilityScore <= 0) {
          continue;
        }
        const synth: RecommendationRequestContext = {
          ...request,
          domain: target as RecommendationRequestContext["domain"],
        };
        const forDomain = (await getEligibleRecommendationCandidates(synth, maxC))?.filter(
          (r): r is PlaybookRecommendation => r.itemType === "playbook" && r.allowed,
        ) ?? [];

        for (const rec of forDomain) {
          if (!rec.allowed) {
            continue;
          }
          const row = await prisma.memoryPlaybook.findUnique({
            where: { id: rec.playbookId },
            include: { currentVersion: true },
          });
          if (!row) {
            continue;
          }
          const partnerRep = playbookSharedContextService.buildSharedContextFromPlaybook({ playbook: row });
          const partnerF = partnerRep
            ? { ...partnerRep.features, ...partnerRep.explicitPreferences }
            : toPlaybookForFit(row);
          const sharedFeatureFit = computeSharedFeatureFit(requestSig, partnerF);
          const scopeFit2 = Math.max(
            sharedFeatureFit,
            computeJsonFeatureFit(requestSig, toPlaybookForFit(row)) * 0.5 + 0.25 * sharedFeatureFit,
          );
          const compat = computeCrossDomainCompatibility(requestDomain, target);
          const tpen = computeTransferPenalty(requestDomain, target);
          const riskP = computeRiskPenalty(row.avgRiskScore ?? null);
          const newScore = computeCrossDomainRecommendationScore({
            baseScore: rec.baseRecommendationScore ?? rec.score * 0.9,
            sharedFeatureFit: scopeFit2,
            compatibilityScore: compat * tfr.compatibilityScore,
            transferPenalty: tpen,
            riskPenalty: riskP,
          });
          const rationale: string[] = [
            `Cross-domain transfer: ${String(requestDomain)} → ${String(target)}`,
            `Shared feature fit (deterministic): ${(scopeFit2 * 100).toFixed(1)}%`,
            `Pair compatibility: ${(compat * 100).toFixed(1)}% (transfer penalty ${(tpen * 100).toFixed(0)}%)`,
            `Governor: ${tfr.allowed ? "ok" : "n/a"}`,
          ];
          if (indexSig) {
            rationale.push(`Index signature (request): ${indexSig.slice(0, 10)}…`);
          }
          if (!tfr.allowed || compat <= 0) {
            continue;
          }
          if (seenPlaybook.has(rec.playbookId)) {
            continue;
          }
          seenPlaybook.add(rec.playbookId);
          const pl: PlaybookRecommendation = {
            ...rec,
            itemType: "playbook" as const,
            score: newScore,
            allowed: rec.allowed,
            blockedReasons: rec.blockedReasons,
            intelligenceSource: "transfer" as const,
            crossDomainMetadata: {
              requestDomain: String(requestDomain),
              candidateDomain: String(target),
              rationale,
            },
            assignmentRationale: [
              `Transfer-adjusted: ${newScore.toFixed(4)} (from native candidate ${(rec.baseRecommendationScore ?? rec.score).toFixed(4)}).`,
            ],
          };
          cross.push({
            itemType: "playbook" as const,
            playbook: pl,
            sharedFeatureFit: scopeFit2,
            compatibilityScore: compat * tfr.compatibilityScore,
            transferPenalty: tpen,
            blockedReasons: [],
            rationale,
          });
        }
      }

      cross.sort((a, b) => b.recommendation.score - a.recommendation.score);
      if (native.length) {
        for (const n of native) {
          if (n.itemType === "playbook") {
            n.intelligenceSource = "native";
            n.crossDomainMetadata = undefined;
          }
        }
      }
      return {
        requestShared,
        requestDomain,
        nativeCandidates: native,
        crossCandidates: cross,
      };
    } catch (e) {
      playbookLog.error("getCrossDomainCandidates", { message: e instanceof Error ? e.message : String(e) });
      return { requestShared, requestDomain: request.domain as unknown as MemoryDomain, nativeCandidates: [], crossCandidates: [] };
    }
  },
};
