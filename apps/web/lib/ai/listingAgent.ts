/** Loose input: works with CRM / marketplace listing JSON from the client. */
export type ListingAgentInput = {
  title?: string | null;
  description?: string | null;
  images?: unknown[] | null;
  price?: number | null;
  /** Real traffic — drives performance boost. */
  views?: number | null;
  /** Confirmed interest / activity — drives performance boost. */
  bookings?: number | null;
  /** When set, enables `price_low` and a market-aware nudge in {@link generatePriceSuggestion}. */
  comparisonAvgPrice?: number | null;
};

export type ListingAgentConfidence = "high" | "medium" | "low";

export type ListingAgentAnalysis = {
  score: number;
  /** Stable issue codes (for actions + UIs that branch on `includes`). */
  issues: string[];
  /** Human-readable next steps, derived from issue codes. */
  actions: string[];
  summary: string;
  /** Ready-to-apply (not applied) title and price; `null` = nothing to offer for that slot. */
  suggestions: { title: string | null; price: number | null };
  /** Coarse quality band from the final score. */
  confidence: ListingAgentConfidence;
};

const ISSUE = {
  titleShort: "title_short",
  descriptionThin: "description_thin",
  fewImages: "few_images",
  priceMissing: "price_missing",
  priceLow: "price_low",
} as const;

/**
 * Generative: concrete title copy the host can copy-paste and tweak (not only instructions).
 */
export function generateTitleSuggestion(input: ListingAgentInput): string | null {
  if (!input.title || input.title.length < 10) {
    return "Modern apartment in prime location with great amenities";
  }
  if (input.title.length < 20) {
    return `${input.title.trim()} — [Add neighborhood, property type, and one must-see feature]`;
  }
  return null;
}

/**
 * Generative: numeric price hint from simple heuristics (+ optional comp midpoint when `price_low`).
 */
export function generatePriceSuggestion(
  input: ListingAgentInput,
  issues: string[]
): number | null {
  if (!input.price || input.price <= 0) {
    return 120;
  }
  if (input.price < 80) {
    return Math.round(input.price * 1.2);
  }
  if (
    issues.includes(ISSUE.priceLow) &&
    input.comparisonAvgPrice != null &&
    input.comparisonAvgPrice > 0 &&
    Number.isFinite(input.comparisonAvgPrice)
  ) {
    return Math.round(((input.price + input.comparisonAvgPrice) / 2) * 100) / 100;
  }
  return null;
}

function confidenceFromScore(score: number): ListingAgentConfidence {
  if (score > 80) {
    return "high";
  }
  if (score > 50) {
    return "medium";
  }
  return "low";
}

export function generateActions(
  _input: ListingAgentInput,
  issues: string[]
): string[] {
  const actions: string[] = [];

  if (issues.includes(ISSUE.titleShort)) {
    actions.push("Write a more descriptive title (location + key feature)");
  }
  if (issues.includes(ISSUE.fewImages)) {
    actions.push("Add at least 5 high-quality images");
  }
  if (issues.includes(ISSUE.priceLow)) {
    actions.push("Increase price closer to market average");
  }
  if (issues.includes(ISSUE.descriptionThin)) {
    actions.push("Expand the description to 300+ characters (rooms, condition, area highlights)");
  }
  if (issues.includes(ISSUE.priceMissing)) {
    actions.push("Set a list price (comps or the pricing / valuation tool)");
  }
  return actions;
}

function collectIssues(input: ListingAgentInput): string[] {
  const issues: string[] = [];

  if (!input.title || input.title.length < 20) {
    issues.push(ISSUE.titleShort);
  }
  if (!input.description || input.description.length < 300) {
    issues.push(ISSUE.descriptionThin);
  }
  if (!input.images || input.images.length < 6) {
    issues.push(ISSUE.fewImages);
  }
  if (!input.price) {
    issues.push(ISSUE.priceMissing);
  } else if (
    typeof input.price === "number" &&
    Number.isFinite(input.price) &&
    input.comparisonAvgPrice != null &&
    input.comparisonAvgPrice > 0 &&
    input.price < input.comparisonAvgPrice * 0.9
  ) {
    issues.push(ISSUE.priceLow);
  }
  return issues;
}

export function computePerformanceBoost(input: ListingAgentInput): number {
  let boost = 0;
  if (input.views != null && input.views > 50) {
    boost += 5;
  }
  if (input.bookings != null && input.bookings > 2) {
    boost += 10;
  }
  return boost;
}

export function analyzeListing(listing: ListingAgentInput): ListingAgentAnalysis {
  const issues = collectIssues(listing);
  const actions = generateActions(listing, issues);

  const baseScore = Math.max(0, 100 - issues.length * 20);
  const performanceBoost = computePerformanceBoost(listing);
  const score = Math.min(100, baseScore + performanceBoost);
  const summary = `Score ${score}/100 — ${issues.length} issues found`;

  const titleSuggestion = generateTitleSuggestion(listing);
  const priceSuggestion = generatePriceSuggestion(listing, issues);

  return {
    score,
    issues,
    actions,
    summary,
    suggestions: {
      title: titleSuggestion,
      price: priceSuggestion,
    },
    confidence: confidenceFromScore(score),
  };
}

/** @internal for tests / callers that need stable issue ids */
export const listingAgentIssueIds = ISSUE;
