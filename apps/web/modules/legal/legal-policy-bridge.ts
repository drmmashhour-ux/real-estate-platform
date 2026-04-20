import type { PolicyDecision } from "@/modules/autonomous-marketplace/types/domain.types";
import type { LegalGateResult } from "./legal-readiness.types";

function isLegalDomain(meta: Record<string, unknown> | undefined): boolean {
  return meta?.domain === "legal";
}

/**
 * Maps a policy decision (legal-only rule set) into the legacy `LegalGateResult` shape for APIs / logging.
 */
export function legalPolicyDecisionToGateResult(decision: PolicyDecision): LegalGateResult {
  const legalRows = decision.ruleResults.filter(
    (r) => r.metadata && typeof r.metadata === "object" && isLegalDomain(r.metadata as Record<string, unknown>),
  );

  const blocked = legalRows.filter((r) => r.result === "blocked");
  if (blocked.length > 0) {
    const meta = blocked[0]?.metadata as { blockingRequirements?: string[]; messages?: string[] } | undefined;
    const reasons =
      meta?.messages?.length ? meta.messages : blocked.map((b) => b.reason).filter((x): x is string => Boolean(x));
    return {
      allowed: false,
      mode: "hard",
      reasons: reasons.length ? reasons : ["Legal compliance policy blocked this action."],
      blockingRequirements: Array.isArray(meta?.blockingRequirements) ? meta!.blockingRequirements! : [],
    };
  }

  const warns = legalRows.filter((r) => r.result === "warning");
  if (warns.length > 0) {
    const meta = warns[0]?.metadata as { messages?: string[] } | undefined;
    const reasons =
      meta?.messages?.length ? meta.messages : warns.map((w) => w.reason).filter((x): x is string => Boolean(x));
    return {
      allowed: true,
      mode: "soft",
      reasons: reasons.length ? reasons : [],
      blockingRequirements: [],
    };
  }

  return {
    allowed: true,
    mode: "none",
    reasons: [],
    blockingRequirements: [],
  };
}
