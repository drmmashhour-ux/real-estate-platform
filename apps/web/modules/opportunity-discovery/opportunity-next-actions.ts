import type { LecipmDiscoveryEntityType, LecipmOpportunityKind } from "@prisma/client";

const STANDARD_DISCLAIMER =
  "Advisory only — not investment advice, not a guaranteed outcome, not a promise of ROI. You decide.";

export function suggestedNextActionsForOpportunity(
  kind: LecipmOpportunityKind,
  entityType: LecipmDiscoveryEntityType,
): string[] {
  const out: string[] = [];
  switch (kind) {
    case "UNDERVALUED":
      out.push("Review comps and seller motivation — contact seller or listing colleague if appropriate.");
      out.push("Generate offer draft (broker review required before any dispatch).");
      out.push("Prepare Centris-ready listing package if you represent the sell side.");
      break;
    case "VALUE_ADD":
      out.push("Run underwriting refresh with updated assumptions.");
      out.push("Prepare investor packet for qualified parties (no public solicitation).");
      out.push("Move to diligence checklist when risk posture is acceptable.");
      break;
    case "HIGH_DEMAND":
      out.push("Prioritize fast response — schedule showing or buyer call.");
      out.push("Approve pricing adjustment only after manual market validation.");
      break;
    case "ESG_UPSIDE":
      out.push("Review ESG evidence coverage and retrofit scenarios (directional payback only).");
      out.push("Explore green financing fit with lender — recommendation only.");
      break;
    case "INVESTOR_FIT":
      out.push("Prepare investor packet — internal distribution; supervised release.");
      out.push("Confirm accreditation / suitability workflow before sharing materials.");
      break;
    case "ARBITRAGE":
      out.push("Activate host pricing recommendations (manual or governed autopilot per listing settings).");
      out.push("Review occupancy and compliance (municipal STR rules) before scaling.");
      break;
    default:
      out.push("Review details in CRM and document your thesis.");
  }
  if (entityType === "DEAL") {
    out.push("Log negotiation posture and material facts in the deal file.");
  }
  out.push(STANDARD_DISCLAIMER);
  return [...new Set(out)];
}
