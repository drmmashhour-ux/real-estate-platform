/**
 * Deterministic recommended actions — stable ordering for tests.
 */

const ORDERED = [
  { flag: "MISREPRESENTATION_RISK", action: "request full seller disclosure" },
  { flag: "INSPECTION_LIMITATION", action: "require document re-verification" },
  { flag: "BAD_FAITH_BEHAVIOR", action: "escalate to legal review" },
  { flag: "BAD_FAITH_NON_DISCLOSURE", action: "escalate to legal review" },
  { flag: "POTENTIAL_LATENT_DEFECT", action: "freeze listing publish" },
  { flag: "LATENT_DEFECT_PATTERN", action: "notify admin compliance" },
  { flag: "BROKER_PROTECTION_RULE", action: "capture broker verification log" },
] as const;

export function buildRecommendedActions(flags: string[], overallRiskLevel: string): string[] {
  const out: string[] = [];
  const push = (s: string) => {
    if (!out.includes(s)) out.push(s);
  };

  for (const row of ORDERED) {
    if (flags.includes(row.flag)) {
      push(row.action);
    }
  }

  if (overallRiskLevel === "HIGH" || overallRiskLevel === "CRITICAL") {
    push("notify admin compliance");
    push("hold commission release");
  }
  if (overallRiskLevel === "CRITICAL") {
    push("escalate to legal review");
  }

  return out.slice(0, 8);
}

export const LEGAL_COMPLIANCE_WARNING_PRIMARY =
  "Potential legal risk detected: incomplete or inconsistent disclosure on a material property component.";
export const LEGAL_COMPLIANCE_WARNING_INSPECTION =
  "Inspection limitations may affect defect visibility. Manual review recommended.";
