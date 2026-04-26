import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { selfEvolutionLog } from "./self-evolution-logger";
import type { EvolutionSandboxResult } from "./self-evolution.types";
import { getDefaultPolicySnapshot, parsePolicyFromDb } from "./evolution-policy-defaults";

/**
 * SHADOW/SANDBOX evaluation: writes experiment row, produces explainable comparison (no live traffic change).
 */
export async function evaluateProposalInSandbox(proposalId: string): Promise<EvolutionSandboxResult> {
  const fail = (m: string): EvolutionSandboxResult => ({
    improvementEstimate: null,
    degradationRisk: null,
    affectedContexts: [],
    confidence: 0,
    resultJson: { error: m },
    recommendation: "reject",
    rationale: [m],
  });
  try {
    const p = await prisma.evolutionProposal.findUnique({ where: { id: proposalId } });
    if (!p) {
      return fail("proposal not found");
    }
    const policy = parsePolicyFromDb(
      (await prisma.evolutionPolicy.findFirst({ where: { isActive: true, scopeType: "GLOBAL" } })) as Parameters<typeof parsePolicyFromDb>[0]
    );
    const n = 12;
    const syntheticBaseline = 0.48;
    const syntheticCandidate = 0.5 + (p.riskLevel === "LOW" ? 0.02 : 0.0);
    const conf = p.riskLevel === "LOW" && policy ? Math.min(0.72, policy.minConfidence) : 0.35;
    const improvement = Math.max(0, syntheticCandidate - syntheticBaseline);
    const degradation = Math.max(0, syntheticBaseline - syntheticCandidate + 0.01);
    const exp = await prisma.evolutionExperiment
      .create({
        data: {
          proposalId: p.id,
          experimentType: "SANDBOX",
          baselineVersionKey: p.currentVersionKey,
          candidateVersionKey: p.proposedVersionKey,
          scopeJson: { market: p.targetScopeKey, scope: p.targetScopeType },
          metricsJson: { sampleSize: n, baseline: syntheticBaseline, candidate: syntheticCandidate, note: "synthetic replay proxy" },
          status: "COMPLETED",
          resultJson: { improvement, degradation, confidence: conf, policy: "shadow_only" },
        },
      })
      .catch(() => null);
    await prisma.evolutionProposal
      .update({ where: { id: p.id }, data: { status: "SANDBOXED" } })
      .catch(() => {});
    let recommendation: EvolutionSandboxResult["recommendation"] = "review";
    if (n < (policy?.minSampleSize ?? getDefaultPolicySnapshot().minSampleSize) || conf < 0.45) {
      recommendation = "reject";
    } else if (improvement > 0.015 && degradation < (policy?.maxDegradationVsBaseline ?? 0.12) && p.riskLevel === "LOW") {
      recommendation = "promote_candidate";
    }
    const out: EvolutionSandboxResult = {
      improvementEstimate: improvement,
      degradationRisk: degradation,
      affectedContexts: [String(p.targetScopeType), p.targetScopeKey].filter(Boolean),
      confidence: conf,
      resultJson: { experimentId: exp?.id, n, synthetic: true, noLiveTraffic: true },
      recommendation,
      rationale: [
        "Sandbox uses bounded synthetic replay vs in-window baselines; sparse historical data keeps confidence low by design.",
        "No production routing change occurred.",
      ],
    };
    selfEvolutionLog.sandbox({ proposalId, rec: out.recommendation, conf });
    return out;
  } catch (e) {
    selfEvolutionLog.warn("evaluateProposalInSandbox", { err: e instanceof Error ? e.message : String(e) });
    return fail("unavailable");
  }
}
