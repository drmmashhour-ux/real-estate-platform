import type { StrategyBenchmarkDomain } from "@prisma/client";
import { prisma } from "@repo/db";
import { buildStrategyContextBucket, normalizeContextInput } from "./context-bucket.service";
import { getActivePolicy, selectStrategyFromScores, computeUcbLiteScore } from "./policy.service";
import { getArmStat, recordSelection, sumBucketPulls } from "./arm-stats.service";
import { reinforcementLog } from "./reinforcement-logger";
import type { ReinforcementCandidate, ReinforcementContextInput } from "./reinforcement.types";

const W_BASE = 0.55;
const W_AVG = 0.45;
const COLD_AVG = 0.45;

type SelectParams = {
  domain: StrategyBenchmarkDomain;
  candidates: ReinforcementCandidate[];
  context: ReinforcementContextInput;
  dealId?: string | null;
  conversationId?: string | null;
  brokerId?: string | null;
  auditRoll?: number;
};

function auditDraw(dealId: string | null | undefined, override?: number): number {
  if (typeof override === "number" && override >= 0 && override < 1) return override;
  if (!dealId) return 0.42;
  let h = 0;
  for (let i = 0; i < dealId.length; i++) h = (h * 31 + dealId.charCodeAt(i)) % 10_007;
  return (h % 1000) / 1000;
}

/**
 * Non-destructive re-rank: picks one key for audit + reorders the rest for display.
 * Never throws.
 */
export async function selectStrategyWithReinforcement(params: SelectParams): Promise<{
  strategyKey: string;
  selectionMode: "exploit" | "explore";
  contextBucket: string;
  adjustedRanking: { strategyKey: string; baseScore: number; adjustedScore: number }[];
  rationale: string[];
  decisionId: string | null;
}> {
  const norm = normalizeContextInput(params.context);
  const contextBucket = buildStrategyContextBucket(norm);
  const allowed = (params.candidates ?? []).filter((c) => !c.blocked && c.strategyKey.length > 0);
  if (allowed.length === 0) {
    return {
      strategyKey: params.candidates[0]?.strategyKey ?? "n/a",
      selectionMode: "exploit",
      contextBucket,
      adjustedRanking: [],
      rationale: ["No non-blocked candidates; fallback only."],
      decisionId: null,
    };
  }

  try {
    const policy = await getActivePolicy(params.domain);
    const pol = policy ?? { id: "fallback", policyType: "EPSILON_GREEDY" as const, explorationRate: 0.08 };
    const totalB = await sumBucketPulls(params.domain, contextBucket);
    const tStep = totalB;
    const roll = auditDraw(params.dealId ?? null, params.auditRoll);

    const armScores: { key: string; baseScore: number; score: number; index: number }[] = [];
    for (let i = 0; i < allowed.length; i++) {
      const c = allowed[i]!;
      const arm = await getArmStat(params.domain, c.strategyKey, contextBucket);
      const base = Math.max(0, Math.min(1, c.baseScore));
      const av = arm?.avgReward != null && Number.isFinite(arm.avgReward) ? arm.avgReward! : COLD_AVG;
      const pulls = arm?.pulls ?? 0;
      const sc =
        pol.policyType === "UCB_LITE"
          ? W_BASE * base + W_AVG * computeUcbLiteScore(av, pulls, totalB, tStep)
          : W_BASE * base + W_AVG * av;
      armScores.push({ key: c.strategyKey, baseScore: base, score: Math.max(0, sc), index: i });
    }

    const { selectedStrategyKey, selectionMode, rationale: polRationale } = selectStrategyFromScores(
      armScores,
      allowed,
      pol,
      totalB,
      tStep,
      roll
    );
    const chosen = armScores.find((s) => s.key === selectedStrategyKey);
    const baseScore = chosen?.baseScore ?? allowed[0]!.baseScore;
    const adjustedScore = chosen?.score ?? baseScore;
    const sorted = [...armScores].sort((a, b) => b.score - a.score);
    const adjustedRanking = sorted.map((r) => ({
      strategyKey: r.key,
      baseScore: r.baseScore,
      adjustedScore: Math.round(r.score * 1000) / 1000,
    }));

    let decisionId: string | null = null;
    try {
      await recordSelection(params.domain, selectedStrategyKey, contextBucket);
      const dec = await prisma.reinforcementDecision.create({
        data: {
          domain: params.domain,
          strategyKey: selectedStrategyKey,
          dealId: params.dealId ?? undefined,
          conversationId: params.conversationId ?? undefined,
          brokerId: params.brokerId ?? undefined,
          contextBucket,
          selectionMode: selectionMode === "explore" ? "explore" : "exploit",
          baseScore,
          adjustedScore,
        },
      });
      decisionId = dec.id;
    } catch {
      /* best-effort audit */
    }
    const rationale = [
      `Context bucket: ${contextBucket.slice(0, 200)}${contextBucket.length > 200 ? "…" : ""}`,
      `Score blend: ${(pol.policyType as string) === "UCB_LITE" ? "UCB-lite" : "ε-greedy"}-style; W_base=${W_BASE}, W_avg=${W_AVG} (soft; does not override safety upstream).`,
      ...polRationale,
    ];
    reinforcementLog.selected({ key: selectedStrategyKey, mode: selectionMode, decisionId, domain: params.domain });
    return {
      strategyKey: selectedStrategyKey,
      selectionMode,
      contextBucket,
      adjustedRanking,
      rationale,
      decisionId,
    };
  } catch (e) {
    reinforcementLog.warn("selectStrategyWithReinforcement", { err: e instanceof Error ? e.message : String(e) });
    const b = allowed[0]!;
    return {
      strategyKey: b.strategyKey,
      selectionMode: "exploit",
      contextBucket: buildStrategyContextBucket(norm),
      adjustedRanking: allowed.map((c) => ({ strategyKey: c.strategyKey, baseScore: c.baseScore, adjustedScore: c.baseScore })),
      rationale: ["Reinforcement layer unavailable; returned first non-blocked candidate (safe fallback)."],
      decisionId: null,
    };
  }
}
