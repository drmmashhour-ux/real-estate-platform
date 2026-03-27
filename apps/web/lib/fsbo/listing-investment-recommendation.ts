/**
 * Rules-based “AI recommendation” for FSBO listings — combines risk/trust scores
 * with simple price-per-sqft heuristics. Not investment advice; for transparency only.
 */

export type InvestmentRecommendationKind = "good_deal" | "high_risk_investment" | "undervalued_property";

export type ListingInvestmentRecommendation = {
  kind: InvestmentRecommendationKind;
  /** Short label for chips */
  label: string;
  /** One-line summary */
  summary: string;
  /** Shown in expanded “why” UI */
  factors: string[];
  tone: "positive" | "caution" | "warning";
};

function undervaluedPpsfThresholdCad(propertyType: string | null | undefined): number {
  const t = (propertyType ?? "").toUpperCase();
  if (t.includes("CONDO")) return 320;
  if (t.includes("TOWN")) return 280;
  if (t.includes("MULTI")) return 220;
  if (t.includes("LAND") || t.includes("COMMERCIAL")) return 180;
  return 260;
}

function pricePerSqftCad(priceCents: number, surfaceSqft: number | null | undefined): number | null {
  if (!surfaceSqft || surfaceSqft < 1) return null;
  return (priceCents / 100) / surfaceSqft;
}

/**
 * Returns a single primary recommendation, or null when there is not enough signal.
 */
export function computeListingInvestmentRecommendation(input: {
  riskScore: number | null | undefined;
  trustScore: number | null | undefined;
  priceCents: number;
  surfaceSqft: number | null | undefined;
  propertyType: string | null | undefined;
}): ListingInvestmentRecommendation | null {
  const risk = input.riskScore;
  const trust = input.trustScore;
  const hasScores = typeof risk === "number" && typeof trust === "number";

  const ppsf = pricePerSqftCad(input.priceCents, input.surfaceSqft);
  const threshold = undervaluedPpsfThresholdCad(input.propertyType);
  const sq = input.surfaceSqft ?? 0;

  const looksUndervalued =
    ppsf != null &&
    ppsf > 0 &&
    ppsf < threshold &&
    sq >= 350 &&
    input.priceCents > 0;

  const factors: string[] = [];
  if (ppsf != null) {
    factors.push(`Approx. ${Math.round(ppsf).toLocaleString()} CAD/sq ft (rule-of-thumb vs ~${threshold} for this type).`);
  }
  if (hasScores) {
    factors.push(`Platform risk score ${risk} / 100, trust score ${trust} / 100.`);
  }

  // 1) High risk (declaration / docs signals)
  if (hasScores && (risk >= 50 || (risk >= 38 && trust < 48))) {
    return {
      kind: "high_risk_investment",
      label: "High risk investment",
      summary:
        "Declaration or document signals suggest elevated risk — dig into disclosures and verification before committing.",
      factors,
      tone: "warning",
    };
  }

  // 2) Undervalued (price efficiency vs rough band; only if not already high-risk)
  if (looksUndervalued && (!hasScores || (risk as number) < 48)) {
    const f = [
      ...factors,
      "Price per sq ft is below a broad rule-of-thumb for the property type — may represent value or missing data.",
    ];
    return {
      kind: "undervalued_property",
      label: "Undervalued property",
      summary:
        "Listed $/sq ft looks attractive vs a simple benchmark — confirm condition, location, and comparables.",
      factors: f,
      tone: "caution",
    };
  }

  // 3) Good deal — strong trust and lower risk
  if (hasScores && trust >= 65 && risk <= 38 && !looksUndervalued) {
    return {
      kind: "good_deal",
      label: "Good deal",
      summary: "Stronger transparency signals and lower flagged risk — still verify financing and inspection.",
      factors,
      tone: "positive",
    };
  }

  if (hasScores && trust >= 58 && risk <= 42 && !looksUndervalued) {
    return {
      kind: "good_deal",
      label: "Good deal",
      summary: "Balanced risk and trust profile on file — compare to similar listings and your own criteria.",
      factors,
      tone: "positive",
    };
  }

  return null;
}
