/**
 * Rule-based revenue tier for mortgage leads (HIGH / MEDIUM / LOW).
 * Inputs align with product form: budget, price, location, urgency.
 */
export type RevenueTier = "HIGH" | "MEDIUM" | "LOW";

export type LeadRevenueScoreInput = {
  /** Optional client budget signal — down payment or monthly budget hint. */
  budget?: number;
  /** Property / purchase price estimate. */
  propertyPrice?: number;
  /** City or region text. */
  location?: string;
  /** Timeline / "how soon" free text or preset label. */
  urgency?: string;
};

function normalizeLoc(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

const HIGH_DEMAND_KEYS = ["montreal", "toronto", "vancouver", "calgary", "ottawa", "quebec", "gatineau"];

export function scoreLeadRevenueTier(input: LeadRevenueScoreInput): RevenueTier {
  let pts = 0;

  const price = input.propertyPrice;
  if (price != null && Number.isFinite(price) && price > 0) {
    if (price >= 850_000) pts += 3;
    else if (price >= 500_000) pts += 2;
    else pts += 1;
  }

  const budget = input.budget;
  if (budget != null && Number.isFinite(budget) && budget > 0) {
    if (budget >= 120_000) pts += 2;
    else if (budget >= 50_000) pts += 1;
  }

  const loc = input.location ? normalizeLoc(input.location) : "";
  if (loc.length > 2) {
    const hot = HIGH_DEMAND_KEYS.some((k) => loc.includes(k));
    if (hot) pts += 2;
    else pts += 1;
  }

  const u = (input.urgency ?? "").trim().toLowerCase();
  if (u) {
    if (
      /\b(asap|urgent|immediate|now|week|30|0\s*-\s*30)\b/.test(u) ||
      u.includes("soon") ||
      u.includes("< 1") ||
      u.includes("under 1")
    ) {
      pts += 2;
    } else if (u.includes("month") || u.includes("year")) pts += 1;
  }

  if (pts >= 7) return "HIGH";
  if (pts >= 4) return "MEDIUM";
  return "LOW";
}

/** Heuristic close probability used for reporting / ROI estimates. */
export function conversionProbabilityForTier(tier: RevenueTier): number {
  switch (tier) {
    case "HIGH":
      return 0.35;
    case "MEDIUM":
      return 0.18;
    default:
      return 0.08;
  }
}

/** Credits charged when a lead of this tier is assigned to an expert with a credits wallet. */
export function mortgageCreditCostForTier(tier: RevenueTier): number {
  switch (tier) {
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 1;
    default:
      return 0;
  }
}
