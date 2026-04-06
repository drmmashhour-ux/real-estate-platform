import type { GrowthActionRecommendation, GrowthAutomationMode, GrowthBrainDomain } from "./types";

const NEVER_AUTO: Set<string> = new Set([
  "payment_change",
  "payout",
  "external_campaign_send",
  "mass_dm",
  "legal_publish",
  "price_change_live",
]);

export function getGrowthAutomationModeFromEnv(): GrowthAutomationMode {
  const raw = (process.env.GROWTH_BRAIN_AUTOMATION_MODE ?? "ASSIST").toUpperCase().trim();
  if (raw === "OFF" || raw === "0" || raw === "FALSE") return "OFF";
  if (raw === "SAFE_AUTOPILOT" || raw === "SAFE") return "SAFE_AUTOPILOT";
  if (raw === "FULL_WITH_APPROVAL" || raw === "FULL") return "FULL_WITH_APPROVAL";
  return "ASSIST";
}

/**
 * Applies automation policy: never auto-run unsafe types; mode gates autoRunnable flag.
 */
export function applyAutomationPolicy(
  rec: Omit<GrowthActionRecommendation, "id" | "createdAt">,
  mode: GrowthAutomationMode
): Omit<GrowthActionRecommendation, "id" | "createdAt"> {
  let autoRunnable = rec.autoRunnable;
  let requiresApproval = rec.requiresApproval;

  if (NEVER_AUTO.has(rec.type) || rec.domain === "revenue") {
    autoRunnable = false;
    requiresApproval = true;
  }

  if (mode === "OFF") {
    autoRunnable = false;
  }

  if (mode === "ASSIST") {
    autoRunnable = false;
  }

  if (mode === "SAFE_AUTOPILOT") {
    if (!isLowRiskDomain(rec.domain) || rec.priority === "high") {
      autoRunnable = false;
      requiresApproval = true;
    }
  }

  if (mode === "FULL_WITH_APPROVAL") {
    if (rec.priority === "high" || !isLowRiskDomain(rec.domain)) {
      autoRunnable = false;
      requiresApproval = true;
    }
  }

  return { ...rec, autoRunnable, requiresApproval };
}

function isLowRiskDomain(d: GrowthBrainDomain): boolean {
  return d === "content" || d === "seo" || d === "retention" || d === "supply";
}

export function isSafeToAutoRun(rec: Pick<GrowthActionRecommendation, "type" | "domain" | "priority">): boolean {
  if (NEVER_AUTO.has(rec.type)) return false;
  if (rec.priority === "high") return false;
  return isLowRiskDomain(rec.domain);
}
