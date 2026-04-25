import type { ReinforcementPolicyType, StrategyBenchmarkDomain } from "@prisma/client";
import { prisma } from "@repo/db";
import type { ReinforcementCandidate } from "./reinforcement.types";
import { reinforcementLog } from "./reinforcement-logger";

const UCB_C = 0.9;
const MAX_EXPLORATION = 0.12;

/**
 * One active row per domain; creates a conservative default if missing.
 */
export async function getActivePolicy(
  domain: StrategyBenchmarkDomain
): Promise<{
  id: string;
  policyType: ReinforcementPolicyType;
  explorationRate: number;
} | null> {
  try {
    const row = await prisma.reinforcementPolicy.findFirst({
      where: { domain, isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    if (row) {
      reinforcementLog.policyLoaded({ domain, type: row.policyType, er: row.explorationRate });
      return { id: row.id, policyType: row.policyType, explorationRate: row.explorationRate };
    }
    const created = await prisma.reinforcementPolicy.create({
      data: {
        domain,
        isActive: true,
        policyType: "EPSILON_GREEDY",
        explorationRate: 0.08,
      },
    });
    reinforcementLog.policyLoaded({ domain, type: created.policyType, er: created.explorationRate, created: true });
    return { id: created.id, policyType: created.policyType, explorationRate: created.explorationRate };
  } catch {
    reinforcementLog.warn("getActivePolicy_fallback", { domain });
    return { id: "fallback", policyType: "EPSILON_GREEDY" as const, explorationRate: 0.08 };
  }
}

export function computeUcbLiteScore(avg: number, pulls: number, totalBucketPulls: number, t: number): number {
  const p = Math.max(1, pulls);
  const tb = Math.max(1, totalBucketPulls);
  return avg + UCB_C * Math.sqrt(Math.log(t + 1) / p);
}

export function computeExplorationDecision(epsilon: number, auditRoll: number): { explore: boolean } {
  const er = Math.min(MAX_EXPLORATION, Math.max(0, epsilon));
  return { explore: auditRoll < er };
}

export type PolicySelectResult = {
  selectedStrategyKey: string;
  selectionMode: "exploit" | "explore";
  rationale: string[];
};

type ArmScore = { key: string; baseScore: number; score: number; index: number };

/**
 * Picks from scored candidates. `auditRoll` should be in [0,1) (caller passes deterministic or logged random).
 */
export function selectStrategyFromScores(
  armScores: ArmScore[],
  candidates: ReinforcementCandidate[],
  policy: { policyType: ReinforcementPolicyType; explorationRate: number },
  totalBucketPulls: number,
  tStep: number,
  auditRoll: number
): PolicySelectResult {
  if (armScores.length === 0) {
    return { selectedStrategyKey: candidates[0]?.strategyKey ?? "n/a", selectionMode: "exploit", rationale: ["No scorable arm; first candidate fallback."] };
  }
  const sorted = [...armScores].sort((a, b) => b.score - a.score);
  const { explore } = computeExplorationDecision(policy.explorationRate, auditRoll);
  if (explore) {
    const valid = armScores;
    const r2 = (auditRoll * 7919) % 1;
    const idx = valid.length > 0 ? Math.min(valid.length - 1, Math.max(0, Math.floor(r2 * valid.length))) : 0;
    const pick = valid[idx] ?? valid[0]!;
    reinforcementLog.explore({ key: pick.key, idx, n: valid.length });
    return {
      selectedStrategyKey: pick.key,
      selectionMode: "explore",
      rationale: [
        `Exploration (ε≈${policy.explorationRate.toFixed(3)}): index ${idx} of ${valid.length} allowed arm(s) (deterministic tie-break from audit draw — not a personal judgment).`,
        "Blocked strategies were not eligible. Exploration stays bounded; base model still shapes candidates upstream.",
      ],
    };
  }
  if (policy.policyType === "UCB_LITE") {
    const best = sorted[0]!;
    return {
      selectedStrategyKey: best.key,
      selectionMode: "exploit",
      rationale: [
        `UCB-style score uses avg reward + ${UCB_C}*sqrt(ln(${tStep + 1})/pulls) with total bucket pulls≈${totalBucketPulls}.`,
        "Exploit pass: top adjusted score in this context bucket (descriptive, not a guarantee of outcome).",
      ],
    };
  }
  const best = sorted[0]!;
  return {
    selectedStrategyKey: best.key,
    selectionMode: "exploit",
    rationale: [
      "ε-greedy exploit step: top adjusted score = weighted blend of base model score and observed avg reward in this context bucket.",
      "Blocked strategies were not eligible.",
    ],
  };
}
