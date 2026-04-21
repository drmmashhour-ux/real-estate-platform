import type {
  BuyerTargeting,
  ComplianceCheckResult,
  GeneratedListingContent,
  ListingPerformanceScore,
  ListingPropertyPartial,
} from "@/modules/listing-assistant/listing-assistant.types";

export function deriveBuyerTargeting(
  property: ListingPropertyPartial,
  _content: GeneratedListingContent,
): BuyerTargeting {
  const price = property.priceMajor ?? 0;
  const bd = property.bedrooms ?? 0;

  if (price >= 1_400_000) {
    return {
      targetBuyer: "Luxury / move-up / investor",
      strategy: "Highlight finishes, exclusivity, and neighbourhood prestige — substantiate every claim.",
    };
  }
  if (price > 0 && price < 450_000 && bd <= 2) {
    return {
      targetBuyer: "First-time buyer / affordability-focused",
      strategy: "Lead with monthly carrying cost framing, transit, and verified municipal taxes.",
    };
  }
  if (bd >= 4) {
    return {
      targetBuyer: "Family",
      strategy: "Highlight schools and parks only when verified; emphasize layout and storage.",
    };
  }
  if (price > 600_000 && bd <= 2) {
    return {
      targetBuyer: "Investor / landlord",
      strategy: "Stress revenue-neutral assumptions only with disclosures — avoid guaranteed rent.",
    };
  }

  return {
    targetBuyer: "Broad resale buyer pool",
    strategy: "Balanced lifestyle + diligence framing; tighten photo order and disclosures.",
  };
}

export function computeListingPerformanceScore(
  content: GeneratedListingContent,
  compliance: ComplianceCheckResult,
): ListingPerformanceScore {
  let score = 42;
  const suggestions: string[] = [];

  const descLen = content.description.length;
  if (descLen > 900) score += 14;
  else if (descLen > 450) score += 8;
  else suggestions.push("Extend description with verified facts (dimensions, taxes, year built).");

  if (content.propertyHighlights.length >= 5) score += 10;
  else suggestions.push("Add more bullet highlights (minimum five strong facts when known).");

  if (content.amenities.length >= 3) score += 6;
  else suggestions.push("Clarify inclusions/exclusions for amenities buyers care about.");

  if (content.title.length >= 28 && content.title.length <= 72) score += 8;
  else suggestions.push("Tune title length for search (~28–72 characters often reads well).");

  if (compliance.riskLevel === "LOW") score += 14;
  else if (compliance.riskLevel === "MEDIUM") {
    score += 6;
    suggestions.push("Resolve compliance warnings to lift trust and conversion.");
  } else {
    suggestions.push("High textual risk — rewrite guarantee-like language before publishing.");
  }

  score = Math.min(100, Math.max(15, Math.round(score)));

  if (score < 70) suggestions.push("Add explicit diligence language (subject to verification).");

  return {
    listingScore: score,
    improvementSuggestions: [...new Set(suggestions)].slice(0, 8),
  };
}
