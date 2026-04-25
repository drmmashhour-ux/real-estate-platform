import type { EvolutionProposalCategory, EvolutionRiskLevel } from "@prisma/client";
import { prisma } from "@repo/db";
import { getDefaultPolicySnapshot, parsePolicyFromDb } from "./evolution-policy-defaults";
import { selfEvolutionLog } from "./self-evolution-logger";
import type { EvolutionCandidate, EvolutionRiskAssessment } from "./self-evolution.types";

async function getActivePolicy() {
  try {
    return await prisma.evolutionPolicy.findFirst({ where: { isActive: true, scopeType: "GLOBAL" }, orderBy: { updatedAt: "desc" } });
  } catch {
    return null;
  }
}

function hasForbiddenToken(j: string): string | null {
  const t = j.toLowerCase();
  if (/\b(compliance|regulatory|oaciq|amfi|securities)\s*relax|override_legal|waive_legal|bypass_approval|financial_approval|autonomy_expand|messaging_blast|external_sms\w*)\b/i.test(t)) {
    return "forbidden_intent_in_payload";
  }
  return null;
}

/**
 * Risk and block rules: legal/compliance/autonomy loosening → blocked. Narrow tuning → LOW–MEDIUM.
 */
export async function assessEvolutionRisk(
  input: Pick<EvolutionCandidate, "category" | "proposalJson" | "rationale" | "targetScopeType">
): Promise<EvolutionRiskAssessment> {
  const blockedReasons: string[] = [];
  const rationale: string[] = [];
  let riskLevel: EvolutionRiskLevel = "MEDIUM";
  const policy = parsePolicyFromDb((await getActivePolicy()) as Parameters<typeof parsePolicyFromDb>[0]);
  const pjson = JSON.stringify({ ...input.proposalJson, rationale: input.rationale });
  const hard = hasForbiddenToken(pjson);
  if (hard) {
    blockedReasons.push(hard, "self_evolution cannot propose legal/compliance/finance/autonomy relaxation");
    return {
      riskLevel: "CRITICAL",
      rationale: blockedReasons,
      blocked: true,
      blockedReasons,
      cap: "block",
    };
  }
  const sem = (input.proposalJson.semantic as string) || "";
  for (const b of policy.blockedSemanticTags) {
    if (String(input.category) === b || sem === b) {
      blockedReasons.push(`category_or_semantic_blocked:${b}`);
    }
  }
  if (blockedReasons.length) {
    return { riskLevel: "CRITICAL", rationale: blockedReasons, blocked: true, blockedReasons, cap: "block" };
  }
  if (["ROUTING_WEIGHT", "RANKING_WEIGHT", "THRESHOLD"].includes(String(input.category))) {
    const ext = input.targetScopeType === "MARKET" || String(input.proposalJson.externalVisibility) === "true";
    if (ext) {
      riskLevel = "MEDIUM";
      rationale.push("External-visibility or market-wide scope raises risk; prefer sandbox and human review.");
    } else {
      riskLevel = "LOW";
      rationale.push("Narrow, internal weight/threshold nudge within bounded prior module patterns.");
    }
  } else if (String(input.category) === "FOLLOWUP_TIMING") {
    riskLevel = "MEDIUM";
    rationale.push("Affects follow-up behavior — not auto-applied; evaluate in sandbox.");
  } else {
    riskLevel = "MEDIUM";
    if (String(input.category) === "PLAYBOOK" || String(input.category) === "HANDOFF_RULE" || String(input.category) === "FEATURE_SUBSET") {
      riskLevel = "HIGH";
      rationale.push("Broader product/process surface; human review required by default policy.");
    } else {
      rationale.push("Default risk band; evidence-gated in governor.");
    }
  }
  selfEvolutionLog.riskAssessed({ category: input.category, risk: riskLevel });
  return { riskLevel, rationale, blocked: false, blockedReasons, cap: "soft" };
}

/**
 * Synchronous re-export for fast checks (uses default policy; no Prisma in tests without mock).
 */
export function assessEvolutionRiskSync(
  input: Pick<EvolutionCandidate, "category" | "proposalJson" | "rationale" | "targetScopeType">,
  policy = getDefaultPolicySnapshot()
): EvolutionRiskAssessment {
  const blockedReasons: string[] = [];
  if (hasForbiddenToken(JSON.stringify(input.proposalJson))) {
    return {
      riskLevel: "CRITICAL",
      rationale: ["forbidden pattern"],
      blocked: true,
      blockedReasons: ["forbidden pattern"],
      cap: "block",
    };
  }
  if (["ROUTING_WEIGHT", "RANKING_WEIGHT", "THRESHOLD"].includes(String(input.category)) && input.targetScopeType === "MARKET") {
    return { riskLevel: "MEDIUM", rationale: ["market scope"], blocked: false, blockedReasons: [] };
  }
  if (["PLAYBOOK", "HANDOFF_RULE", "FEATURE_SUBSET"].includes(String(input.category))) {
    return { riskLevel: "HIGH", rationale: ["playbook or handoff"], blocked: false, blockedReasons: [] };
  }
  return { riskLevel: "LOW", rationale: ["synthetic pass"], blocked: false, blockedReasons: [] };
}
