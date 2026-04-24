import type { MemoryDomain, PlaybookAssignmentSelectionMode, PlaybookExecutionMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { playbookLog } from "../playbook-memory.logger";
import type {
  PlaybookAssignmentResult,
  PlaybookBanditContext,
  PlaybookComparableContext,
  PlaybookRecommendation,
  RecommendationRequestContext,
} from "../types/playbook-memory.types";
import {
  DEFAULT_EXPLORATION_RATE,
  computeExplorationDecision,
  computeSelectionScore,
  computeUncertaintyBonus,
  stableStringify,
} from "../utils/playbook-memory-bandit";
import { buildMarketKey, buildSegmentKey, buildSimilarityFingerprint } from "../utils/playbook-memory-fingerprint";
import {
  playbookMemoryBanditService,
  type BanditKey,
  versionKey,
  banditKeyHash,
} from "./playbook-memory-bandit.service";
import { getEligibleRecommendationCandidates } from "./playbook-memory-recommendation.service";

function toRequestContext(c: PlaybookBanditContext): RecommendationRequestContext {
  return {
    domain: c.domain,
    entityType: c.entityType,
    market: c.market,
    segment: c.segment,
    signals: c.signals,
    policyFlags: c.policyFlags,
    autonomyMode: c.autonomyMode,
    candidatePlaybookIds: c.candidatePlaybookIds,
  };
}

function toComparable(c: PlaybookBanditContext): PlaybookComparableContext {
  return {
    domain: c.domain as MemoryDomain,
    entityType: c.entityType,
    entityId: c.entityId,
    market: c.market as PlaybookComparableContext["market"],
    segment: c.segment as PlaybookComparableContext["segment"],
    signals: c.signals,
  };
}

function explorationRate(c: PlaybookBanditContext): number {
  if (c.explorationRate == null || !Number.isFinite(c.explorationRate)) {
    return DEFAULT_EXPLORATION_RATE;
  }
  return Math.max(0.05, Math.min(0.35, c.explorationRate));
}

function banditKeyForCandidate(
  domain: MemoryDomain,
  seg: string,
  mkt: string,
  rec: PlaybookRecommendation,
): BanditKey {
  return {
    domain,
    segmentKey: seg,
    marketKey: mkt,
    playbookId: rec.playbookId,
    playbookVersionId: versionKey(rec.playbookVersionId),
  };
}

/**
 * Select the best **allowed** playbook for a context. Creates an auditable row; does not execute.
 * Never throws — returns `null` when no safe candidate exists.
 */
export const playbookMemoryAssignmentService = {
  async assignBestPlaybook(context: PlaybookBanditContext): Promise<PlaybookAssignmentResult | null> {
    try {
      const req = toRequestContext(context);
      const cmp = toComparable(context);
      const seg = buildSegmentKey(cmp);
      const mkt = buildMarketKey(cmp);
      const fp = buildSimilarityFingerprint(cmp);
      const rate = explorationRate(context);

      const candidates = await getEligibleRecommendationCandidates(req, 32);
      if (candidates == null || candidates.length === 0) {
        playbookLog.info("assignBestPlaybook", { result: "empty", domain: context.domain });
        return null;
      }

      const dom = context.domain as MemoryDomain;
      const keys: BanditKey[] = candidates.map((c) => banditKeyForCandidate(dom, seg, mkt, c));
      const statMap = await playbookMemoryBanditService.getBanditStats({ keys });

      const explore = computeExplorationDecision(
        stableStringify({ fp, domain: context.domain, pids: candidates.map((c) => c.playbookId).sort() }),
        rate,
      );
      const mode: PlaybookAssignmentSelectionMode = explore ? "explore" : "exploit";

      type Cand = { rec: PlaybookRecommendation; sel: number; unc: number; mean: number; key: BanditKey };
      const enriched: Cand[] = candidates.map((rec) => {
        const k = banditKeyForCandidate(dom, seg, mkt, rec);
        const h = banditKeyHash(k);
        const row = statMap.get(h);
        const imps = row?.impressions ?? 0;
        const unc = computeUncertaintyBonus(imps);
        const mean = row?.avgReward != null && Number.isFinite(row.avgReward) ? row.avgReward : 0.5;
        const sel = computeSelectionScore({ recommendationScore: rec.score, meanReward: mean, uncertaintyBonus: unc });
        return { rec, sel, unc, mean, key: k };
      });

      const pick: Cand = explore
        ? [...enriched].sort((a, b) => (b.unc !== a.unc ? b.unc - a.unc : a.rec.playbookId.localeCompare(b.rec.playbookId)))[0]!
        : [...enriched].sort((a, b) => (b.sel !== a.sel ? b.sel - a.sel : a.rec.playbookId.localeCompare(b.rec.playbookId)))[0]!;

      const chosen = pick.rec;
      const selScore = pick.sel;
      const recScore = chosen.score;
      const execMode = chosen.executionMode as PlaybookExecutionMode;
      const rationale: string[] = [
        explore
          ? "Exploration: pseudo-random hash fell below the configured low exploration rate. Chose a candidate with high uncertainty to gather signal."
          : "Exploitation: picked the best blend of model score, historical reward, and uncertainty in the eligible (policy-safe) set.",
        `Segment ${seg}, market ${mkt}, fingerprint ${fp.slice(0, 10)}…`,
        `Selection score: ${selScore.toFixed(4)}; model rank score: ${recScore.toFixed(4)}; exploration rate: ${rate.toFixed(3)}`,
      ];

      const row = await prisma.playbookAssignment
        .create({
          data: {
            domain: dom,
            entityType: context.entityType,
            entityId: context.entityId ?? null,
            playbookId: chosen.playbookId,
            playbookVersionId: chosen.playbookVersionId,
            playbookVersionKey: versionKey(chosen.playbookVersionId),
            recommendationScore: recScore,
            selectionScore: selScore,
            explorationRate: rate,
            selectionMode: mode,
            contextSnapshot: cmp as object,
            segmentKey: seg,
            marketKey: mkt,
            fingerprint: fp,
            executionMode: execMode,
            executed: false,
          },
        })
        .catch((e) => {
          playbookLog.error("playbookAssignment.create", { message: e instanceof Error ? e.message : String(e) });
          return null;
        });

      if (row == null) {
        return null;
      }

      await playbookMemoryBanditService.upsertSelectionImpression({ ...pick.key, alsoExecute: false });

      playbookLog.info("assignBestPlaybook", { assignmentId: row.id, mode, playbookId: chosen.playbookId });

      return {
        assignmentId: row.id,
        playbookId: chosen.playbookId,
        playbookVersionId: chosen.playbookVersionId,
        selectionMode: mode,
        recommendationScore: recScore,
        selectionScore: selScore,
        executionMode: chosen.executionMode,
        rationale,
      };
    } catch (e) {
      playbookLog.error("assignBestPlaybook", { message: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },

  async createManualAssignment(params: {
    context: PlaybookBanditContext;
    playbook: PlaybookRecommendation;
  }): Promise<PlaybookAssignmentResult | null> {
    try {
      if (!params.playbook.allowed) {
        return null;
      }
      const cmp = toComparable(params.context);
      const dom = params.context.domain as MemoryDomain;
      const seg = buildSegmentKey(cmp);
      const mkt = buildMarketKey(cmp);
      const fp = buildSimilarityFingerprint(cmp);
      const p = params.playbook;
      const sel = p.score;

      const row = await prisma.playbookAssignment
        .create({
          data: {
            domain: dom,
            entityType: params.context.entityType,
            entityId: params.context.entityId ?? null,
            playbookId: p.playbookId,
            playbookVersionId: p.playbookVersionId,
            playbookVersionKey: versionKey(p.playbookVersionId),
            recommendationScore: p.score,
            selectionScore: sel,
            explorationRate: null,
            selectionMode: "manual",
            contextSnapshot: cmp as object,
            segmentKey: seg,
            marketKey: mkt,
            fingerprint: fp,
            executionMode: p.executionMode,
            executed: false,
          },
        })
        .catch(() => null);
      if (row == null) return null;
      const k: BanditKey = banditKeyForCandidate(dom, seg, mkt, p);
      await playbookMemoryBanditService.upsertSelectionImpression({ ...k, alsoExecute: false });
      return {
        assignmentId: row.id,
        playbookId: p.playbookId,
        playbookVersionId: p.playbookVersionId,
        selectionMode: "manual",
        recommendationScore: p.score,
        selectionScore: sel,
        executionMode: p.executionMode,
        rationale: [
          "Manual policy selection (operator specified eligible playbook).",
          `Model rank score: ${p.score.toFixed(4)}; segment: ${seg}; market: ${mkt}`,
        ],
      };
    } catch (e) {
      playbookLog.error("createManualAssignment", { message: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },

  async attachAssignmentOutcome(params: {
    assignmentId: string;
    memoryRecordId?: string | null;
    outcomeStatus: import("@prisma/client").MemoryOutcomeStatus;
    realizedValue?: number | null;
    realizedRevenue?: number | null;
    realizedConversion?: number | null;
    realizedRiskScore?: number | null;
  }): Promise<void> {
    try {
      const a = await prisma.playbookAssignment.findUnique({ where: { id: params.assignmentId } });
      if (!a) {
        playbookLog.warn("attachAssignmentOutcome", { message: "assignment_not_found", id: params.assignmentId });
        return;
      }
      await prisma.playbookAssignment
        .update({
          where: { id: a.id },
          data: {
            memoryRecordId: params.memoryRecordId ?? undefined,
            outcomeStatus: params.outcomeStatus,
            realizedValue: params.realizedValue ?? undefined,
            realizedRevenue: params.realizedRevenue ?? undefined,
            realizedConversion: params.realizedConversion ?? undefined,
          },
        })
        .catch((e) => {
          playbookLog.error("attachAssignmentOutcome_update", { message: e instanceof Error ? e.message : String(e) });
        });

      await playbookMemoryBanditService.updateBanditOutcome({
        domain: a.domain,
        segmentKey: a.segmentKey ?? "",
        marketKey: a.marketKey ?? "",
        playbookId: a.playbookId,
        playbookVersionId: a.playbookVersionId ? versionKey(a.playbookVersionId) : a.playbookVersionKey,
        selectionMode: a.selectionMode,
        outcomeStatus: params.outcomeStatus,
        rewardHint: {
          realizedValue: params.realizedValue,
          realizedRevenue: params.realizedRevenue,
          realizedConversion: params.realizedConversion,
          realizedRiskScore: params.realizedRiskScore,
        },
      });
    } catch (e) {
      playbookLog.error("attachAssignmentOutcome", { message: e instanceof Error ? e.message : String(e) });
    }
  },
};
