import type { MemoryDomain, MemoryPlaybook, MemoryPlaybookVersion, PlaybookExecutionMode } from "@prisma/client";
import { augmentRecommendationContext } from "@/modules/playbook-domains/augment-recommendation-context";
import { prisma } from "@/lib/db";
import type {
  PlaybookExecutionPlan,
  PlaybookRecommendation,
  RecommendationRequestContext,
} from "../types/playbook-memory.types";
import { buildExecutionPlan } from "../utils/playbook-memory-execution";
import { playbookLog } from "../playbook-memory.logger";
import {
  buildPlaybookRecommendationRationale,
  computeContextFitScore,
  computeExecutionVolumeScore,
  computeRecommendationScore,
  computeRiskPenalty,
  computeScoreBandValue,
  computeSuccessRate,
} from "../utils/playbook-memory-recommendation";
import { confidenceFromExecutionStats } from "../utils/playbook-memory-score";
import { evaluatePlaybookEligibility, type AutonomyModeHint } from "./playbook-memory-policy-gate.service";

function actionTypeFromVersion(
  v: (Pick<MemoryPlaybookVersion, "actionTemplate"> & { actionTemplate?: unknown }) | null,
): string | null {
  if (!v) return null;
  const t = v.actionTemplate;
  if (t && typeof t === "object" && !Array.isArray(t) && "actionType" in t) {
    const at = (t as { actionType?: unknown }).actionType;
    if (typeof at === "string" && at.length) return at;
  }
  return null;
}

function mapAutonomyForEligibility(
  m?: RecommendationRequestContext["autonomyMode"],
): AutonomyModeHint | undefined {
  if (m == null) return undefined;
  return m as AutonomyModeHint;
}

type Scored = {
  playbook: MemoryPlaybook;
  currentVersion: MemoryPlaybookVersion | null;
  /** Display / rank score (with small governance nudges). */
  score: number;
  /** Raw model mix before status / version nudges. */
  baseModelScore: number;
  contextFit: number;
};

/**
 * All scored & gated rows for a domain; used by API and assignment. Never throws — returns `null` on hard failure.
 */
export async function getEligibleRecommendationCandidates(
  context: RecommendationRequestContext,
  max = 32,
): Promise<PlaybookRecommendation[] | null> {
  const rows = await buildAllPlaybookRows(context);
  if (rows == null) return null;
  const allow = rows.filter((r) => r.allowed);
  return allow.slice(0, max);
}

async function buildAllPlaybookRows(context: RecommendationRequestContext): Promise<PlaybookRecommendation[] | null> {
  try {
    if (context.candidatePlaybookIds && context.candidatePlaybookIds.length === 0) {
      return [];
    }

    const contextWithDomain = await augmentRecommendationContext(context);
    const whereDomain = contextWithDomain.domain as unknown as MemoryDomain;

    const playbooks = await prisma.memoryPlaybook.findMany({
      where: {
        domain: whereDomain,
        ...(contextWithDomain.candidatePlaybookIds?.length
          ? { id: { in: contextWithDomain.candidatePlaybookIds } }
          : {}),
      },
      include: { currentVersion: true },
    });

    if (playbooks.length === 0) {
      return [];
    }

    const scored: Scored[] = playbooks.map((p) => {
      const cv = p.currentVersion;
      const contextFit = computeContextFitScore(contextWithDomain, p);
      const successRate = computeSuccessRate(p);
      const bandValue = computeScoreBandValue(p.scoreBand);
      const volume = computeExecutionVolumeScore(p.totalExecutions);
      const riskPen = computeRiskPenalty(p.avgRiskScore ?? null);
      const baseModelScore = computeRecommendationScore({
        contextFit,
        successRate,
        bandValue,
        volumeScore: volume,
        riskPenalty: riskPen,
      });
      let display = baseModelScore;
      if (p.status === "ACTIVE") {
        display = Math.min(1, display + 0.05);
      }
      if (cv && cv.isActive) {
        display = Math.min(1, display + 0.03);
      } else {
        display = display * 0.65;
      }
      return { playbook: p, currentVersion: cv, score: display, baseModelScore, contextFit };
    });

    scored.sort((a, b) => {
      const aActive = a.playbook.status === "ACTIVE" ? 1 : 0;
      const bActive = b.playbook.status === "ACTIVE" ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      const aVer = a.currentVersion?.isActive ? 1 : 0;
      const bVer = b.currentVersion?.isActive ? 1 : 0;
      if (aVer !== bVer) return bVer - aVer;
      if (b.score !== a.score) return b.score - a.score;
      return a.playbook.id.localeCompare(b.playbook.id);
    });

    return scored.map((s) => {
      const p = s.playbook;
      const cv = s.currentVersion;
      const versionBlocked: string[] = [];
      if (!p.currentVersionId || !cv) {
        versionBlocked.push("missing_current_version");
      } else if (!cv.isActive) {
        versionBlocked.push("current_version_not_active");
      }

      const gate = evaluatePlaybookEligibility({
        status: p.status,
        executionMode: p.executionMode,
        scoreBand: p.scoreBand,
        avgRiskScore: p.avgRiskScore,
        policyFlags: contextWithDomain.policyFlags,
        autonomyMode: mapAutonomyForEligibility(contextWithDomain.autonomyMode),
        domain: p.domain,
      });

      const allBlocked = [...versionBlocked, ...gate.blockedReasons];
      const allowed = versionBlocked.length === 0 && gate.allowed;
      const policyBlocked = !allowed;

      const rationale = buildPlaybookRecommendationRationale({
        contextFit: s.contextFit,
        successRate: computeSuccessRate(p),
        scoreBand: p.scoreBand,
        totalExecutions: p.totalExecutions,
        avgRiskScore: p.avgRiskScore ?? null,
        lastPromotedAt: p.lastPromotedAt,
        policyBlocked,
      });

      const executionMode = p.executionMode as PlaybookExecutionMode;
      const at = actionTypeFromVersion(cv);

      const rec: PlaybookRecommendation = {
        itemType: "playbook",
        playbookId: p.id,
        playbookVersionId: cv && cv.isActive ? cv.id : null,
        key: p.key,
        name: p.name,
        actionType: at,
        score: s.score,
        confidence: confidenceFromExecutionStats(p.totalExecutions),
        allowed,
        blockedReasons: allBlocked,
        rationale,
        executionMode: executionMode as PlaybookRecommendation["executionMode"],
        baseRecommendationScore: s.baseModelScore,
        assignmentRationale: [
          `Model blend score: ${s.baseModelScore.toFixed(4)} (pre-nudge).`,
          `Rank score: ${s.score.toFixed(4)} (after status / version nudges).`,
        ],
      };
      return rec;
    });
  } catch (e) {
    playbookLog.error("buildAllPlaybookRows", {
      message: e instanceof Error ? e.message : String(e),
      domain: context.domain,
    });
    return null;
  }
}

/**
 * Playbook-first recommendations: deterministic score + governance gate per candidate. Never throws.
 */
export const playbookMemoryRecommendationService = {
  async getPlaybookRecommendations(
    context: RecommendationRequestContext,
  ): Promise<PlaybookRecommendation[]> {
    try {
      const withRows = await buildAllPlaybookRows(context);
      if (withRows == null) {
        return [];
      }
      if (withRows.length === 0) {
        playbookLog.info("getPlaybookRecommendations", { count: 0, domain: context.domain });
        return [];
      }

      const allowed = withRows.filter((r) => r.allowed);
      const blocked = withRows.filter((r) => !r.allowed);
      const out: PlaybookRecommendation[] = allowed.length ? allowed.slice(0, 5) : blocked.slice(0, 5);

      playbookLog.info("getPlaybookRecommendations", {
        count: out.length,
        domain: context.domain,
        allowed: out.filter((o) => o.allowed).length,
      });
      return out;
    } catch (e) {
      playbookLog.error("getPlaybookRecommendations failed", {
        message: e instanceof Error ? e.message : String(e),
        domain: context.domain,
      });
      return [];
    }
  },
};

export function buildExecutionPlanFromRecommendation(recommendation: PlaybookRecommendation): PlaybookExecutionPlan {
  return buildExecutionPlan(recommendation);
}
