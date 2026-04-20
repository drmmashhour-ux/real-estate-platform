import type { TrustScore } from "./trust.types";

export type TrustUpgradeOpportunity = {
  id: string;
  title: string;
  detail: string;
  kind: "verification" | "compliance" | "reputation" | "planning";
};

/**
 * Product hooks only — no billing or paywall enforcement (Phase 5).
 */
export function getTrustUpgradeOpportunities(trustScore: TrustScore): TrustUpgradeOpportunity[] {
  try {
    const out: TrustUpgradeOpportunity[] = [];
    const fac = trustScore.factors.join(" ").toLowerCase();

    if (fac.includes("email") && fac.includes("no")) {
      out.push({
        id: "verify-email",
        title: "Verify your email",
        detail: "Complete email verification to strengthen account trust and unlock more visibility options when enabled.",
        kind: "verification",
      });
    }
    if (fac.includes("phone") && fac.includes("no")) {
      out.push({
        id: "verify-phone",
        title: "Verify your phone number",
        detail: "Phone verification improves contact quality signals used in trust scoring.",
        kind: "verification",
      });
    }
    if (fac.includes("legal readiness not loaded")) {
      out.push({
        id: "finish-legal-hub",
        title: "Complete Legal Hub checklists",
        detail: "Finish compliance checklists so readiness can contribute to trust (platform guidance — not legal advice).",
        kind: "compliance",
      });
    }
    if (fac.includes("rejection rate") && !fac.includes("0%")) {
      out.push({
        id: "fix-rejections",
        title: "Address rejected submissions",
        detail: "Resubmit or correct rejected documents to recover trust from document workflow signals.",
        kind: "compliance",
      });
    }
    if (fac.includes("critical")) {
      out.push({
        id: "resolve-signals",
        title: "Review open compliance signals",
        detail: "Resolve outstanding compliance intelligence items to remove trust penalties.",
        kind: "compliance",
      });
    }
    if (trustScore.level === "low" || trustScore.level === "medium") {
      out.push({
        id: "premium-exposure-future",
        title: "Higher exposure (future paid option)",
        detail: "Premium visibility products may layer on top of earned trust — not enabled in this release.",
        kind: "planning",
      });
    }
    return out.slice(0, 6);
  } catch {
    return [];
  }
}
