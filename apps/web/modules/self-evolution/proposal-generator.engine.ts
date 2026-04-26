import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import type { EvolutionAuthorKind, EvolutionProposalCategory, EvolutionTargetScopeType } from "@prisma/client";
import { analyzeRoiPerformance } from "@/modules/investor-intelligence/roi-engine.service";
import { selfEvolutionLog } from "./self-evolution-logger";
import { assessEvolutionRisk } from "./risk-assessment.service";
import { getReinforcementDashboardInsights } from "@/modules/reinforcement/reinforcement-insights.service";

/**
 * Narrow, explicit proposals from read-only signals. No policy relaxation, no auto-exec.
 */
export async function generateEvolutionProposals(
  options?: { persist?: boolean; generatedBy?: EvolutionAuthorKind }
): Promise<string[]> {
  const ids: string[] = [];
  const gen: EvolutionAuthorKind = options?.generatedBy ?? "SYSTEM";
  const persist = options?.persist === true;
  const candidates: {
    category: EvolutionProposalCategory;
    targetScopeType: EvolutionTargetScopeType;
    targetScopeKey: string;
    currentVersionKey: string;
    proposedVersionKey: string;
    proposalJson: Record<string, unknown>;
    rationale: string[];
    expectedImpact: Record<string, unknown>;
  }[] = [];
  try {
    const [rein, roi] = await Promise.all([
      getReinforcementDashboardInsights().catch(() => null),
      analyzeRoiPerformance({ persist: false, lookbackDays: 90 }).catch(() => []),
    ]);
    if (rein?.topArms[0]) {
      const t = rein.topArms[0]!;
      candidates.push({
        category: "ROUTING_WEIGHT",
        targetScopeType: "SEGMENT",
        targetScopeKey: t.contextBucket.slice(0, 200),
        currentVersionKey: `v-rw-base-${t.strategyKey}`.slice(0, 250),
        proposedVersionKey: `v-rw-cand-${(t.avgReward ?? 0).toFixed(3)}-${t.strategyKey}`.slice(0, 250),
        proposalJson: { delta: 0.04, strategyKey: t.strategyKey, domain: t.domain, contextBucket: t.contextBucket, pulls: t.pulls },
        rationale: [
          "Top arm by avg reward in reinforcement window — small bounded routing delta only (not production routing change).",
        ],
        expectedImpact: { type: "band", upper: 0.02, basedOn: "reinforcement_arm_stats", not: "outcome_guarantee" },
      });
    }
    const weakMkt = [...roi]
      .filter((r) => r.scopeType === "MARKET" && (r.wonDeals + r.lostDeals) > 0)
      .sort((a, b) => (a.efficiencyScore ?? 0) - (b.efficiencyScore ?? 0))[0];
    if (weakMkt) {
      candidates.push({
        category: "FOLLOWUP_TIMING",
        targetScopeType: "MARKET",
        targetScopeKey: weakMkt.scopeKey,
        currentVersionKey: "followup_t_default",
        proposedVersionKey: "followup_t_tight_1", // version-addressable only
        proposalJson: { dayReduction: 1, scope: weakMkt.scopeKey, trace: (weakMkt.trace ?? [])[0] },
        rationale: [
          "Weaker efficiency band in market — suggest re-checking follow-up timeliness in CRM (suggestion, not an automated timer change).",
        ],
        expectedImpact: { qualitative: "faster re-engagement in sandbox evaluation only" },
      });
    }
    const th = roi.find(
      (r) => (r.wonDeals + r.lostDeals) > 5 && (r.efficiencyScore ?? 0) > 0.5 && (r.efficiencyScore ?? 0) < 0.7
    );
    if (th) {
      candidates.push({
        category: "THRESHOLD",
        targetScopeType: "GLOBAL",
        targetScopeKey: "scoring",
        currentVersionKey: "thr_v1",
        proposedVersionKey: "thr_v1_candidate_b",
        proposalJson: { scope: `${th.scopeType}:${th.scopeKey}`, nudge: 0.02 },
        rationale: [
          "Bounded threshold nudge in scoring layer — evaluated in shadow only. Not a public ranking promise.",
        ],
        expectedImpact: { bounded: true, maxNudge: 0.02, trace: th.trace[0] },
      });
    }
    if (rein?.weakArms[0]) {
      const w = rein.weakArms[0]!;
      candidates.push({
        category: "PLAYBOOK",
        targetScopeType: "DOMAIN",
        targetScopeKey: w.domain,
        currentVersionKey: `pb-${w.strategyKey}`.slice(0, 250),
        proposedVersionKey: `pb-cand-restrict-${w.strategyKey}`.slice(0, 250),
        proposalJson: { action: "restrict_exposure", strategyKey: w.strategyKey, contextBucket: w.contextBucket, pulls: w.pulls },
        rationale: [
          "Weak arm — propose lowering automated exposure; requires human approval per policy (playbook).",
        ],
        expectedImpact: { riskReduction: "qualitative" },
      });
    }
  } catch (e) {
    selfEvolutionLog.warn("generateEvolutionProposals", { err: e instanceof Error ? e.message : String(e) });
  }
  for (const c of candidates) {
    const r = await assessEvolutionRisk({
      category: c.category,
      proposalJson: c.proposalJson,
      rationale: c.rationale,
      targetScopeType: c.targetScopeType,
    });
    if (r.blocked) {
      selfEvolutionLog.riskAssessed({ category: c.category, blocked: true, reasons: r.blockedReasons.length });
      continue;
    }
    if (!persist) {
      continue;
    }
    try {
      const created = await prisma.evolutionProposal.create({
        data: {
          category: c.category,
          targetScopeType: c.targetScopeType,
          targetScopeKey: c.targetScopeKey,
          currentVersionKey: c.currentVersionKey,
          proposedVersionKey: c.proposedVersionKey,
          proposalJson: c.proposalJson,
          rationaleJson: c.rationale,
          expectedImpactJson: c.expectedImpact,
          riskLevel: r.riskLevel,
          status: "DRAFT",
          generatedBy: gen,
        },
      });
      ids.push(created.id);
    } catch (e) {
      selfEvolutionLog.warn("proposal_persist", { err: e instanceof Error ? e.message : String(e) });
    }
  }
  if (persist) {
    selfEvolutionLog.proposalsGenerated({ count: ids.length });
  } else {
    selfEvolutionLog.proposalsGenerated({ count: 0, dryRunCandidates: candidates.length, note: "persist=false" });
  }
  return ids;
}
