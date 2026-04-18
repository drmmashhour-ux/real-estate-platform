import type { AutopilotDomain, RankBucket, RankedAction } from "../ai-autopilot.types";

/** Relative platform value weight for ranking (not currency). */
export function domainImportance(domain: AutopilotDomain): number {
  switch (domain) {
    case "bnhub":
      return 8;
    case "broker_deal":
      return 7;
    case "listing":
      return 6;
    case "lead_crm":
      return 5;
    case "growth":
      return 4;
    case "fraud_trust":
      return 9;
    case "founder_admin":
      return 3;
    default:
      return 2;
  }
}

/** Heuristic priority score — urgency, confidence, risk, domain importance. */
export function profitPriorityScore(a: RankedAction): number {
  const urgency =
    a.bucket === "do_now" ? 40 : a.bucket === "do_today" ? 30 : a.bucket === "do_this_week" ? 20 : 5;
  const riskPenalty =
    a.riskLevel === "CRITICAL"
      ? -25
      : a.riskLevel === "HIGH"
        ? -15
        : a.riskLevel === "MEDIUM"
          ? -8
          : 0;
  const conf = Math.min(20, Math.round(a.confidence * 20));
  const dom = domainImportance(a.domain);
  return urgency + conf + riskPenalty + dom;
}
