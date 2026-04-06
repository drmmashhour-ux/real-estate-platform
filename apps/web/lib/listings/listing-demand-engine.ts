/**
 * Pure demand score, urgency copy, and pricing insight helpers.
 * Threshold-based only — callers must gate UI on `hasReliableDemandSignal` to avoid empty hype.
 */

export type DemandUrgencyLevel = "low" | "medium" | "high";

export type DemandInputs = {
  views24h: number;
  uniqueViews24h: number;
  contactClicks: number;
  bookingAttempts: number;
  saves: number;
};

/** Raw weighted score before normalization. */
export function computeRawDemandScore(input: DemandInputs): number {
  const v = Math.max(input.uniqueViews24h, input.views24h * 0.5);
  return v * 0.2 + input.contactClicks * 2 + input.bookingAttempts * 3 + input.saves * 1.5;
}

/** Map raw score to 0–100 (tunable cap). */
export function normalizeDemandScore(raw: number): number {
  const cap = 100;
  return Math.max(0, Math.min(100, Math.round((raw / cap) * 100)));
}

/**
 * True when we have enough real activity to show demand messaging (safety).
 */
export function hasReliableDemandSignal(input: DemandInputs, demandScore: number): boolean {
  if (demandScore >= 35) return true;
  if (input.uniqueViews24h >= 8 || input.views24h >= 12) return true;
  if (input.contactClicks >= 1) return true;
  if (input.saves >= 2) return true;
  if (input.bookingAttempts >= 1) return true;
  return false;
}

export type UrgencyPresentation = {
  label: string;
  level: DemandUrgencyLevel;
  /** Short badge text (no fabricated counts). */
  badge: string | null;
};

export function getUrgencyPresentation(
  input: DemandInputs,
  demandScore: number,
  opts?: { lowAvailability?: boolean }
): UrgencyPresentation | null {
  if (!hasReliableDemandSignal(input, demandScore)) {
    if (opts?.lowAvailability) {
      return {
        label: "Limited availability for this stay",
        level: "medium",
        badge: "Limited availability",
      };
    }
    return null;
  }

  /** Approved marketplace copy only — no fabricated counts or “buyer” tallies. */
  const strongInterest = {
    label: "This listing may be taken soon",
    level: "high" as const,
    badge: "High interest listing",
  };

  if (input.bookingAttempts > 3) {
    return strongInterest;
  }
  if (input.views24h > 50 || input.uniqueViews24h > 35) {
    return strongInterest;
  }
  if (demandScore > 80) {
    return strongInterest;
  }
  if (demandScore > 60) {
    return {
      label: "High interest listing",
      level: "medium",
      badge: "High interest listing",
    };
  }
  if (opts?.lowAvailability) {
    return {
      label: "Limited availability for this stay",
      level: "medium",
      badge: "Limited availability",
    };
  }
  return {
    label: "This listing may be taken soon",
    level: "low",
    badge: "This listing may be taken soon",
  };
}

export type PricingInsightResult = {
  headline: string;
  detail: string | null;
};

export function getPricingInsight(params: {
  listingPriceCents: number;
  marketAvgCents: number | null;
  demandScore: number;
}): PricingInsightResult {
  const { listingPriceCents, marketAvgCents, demandScore } = params;
  if (!marketAvgCents || marketAvgCents <= 0) {
    return { headline: "Fair market price", detail: null };
  }
  const ratio = listingPriceCents / marketAvgCents;
  let headline: string;
  if (ratio < 0.92) headline = "Good deal";
  else if (ratio > 1.08) headline = "Premium listing";
  else headline = "Fair market price";

  let detail: string | null = null;
  if (demandScore >= 65 && ratio < 0.95) {
    detail = "High demand at a competitive price";
  } else if (headline === "Fair market price" && ratio >= 0.95 && ratio <= 1.05) {
    detail = "Competitive price in this area";
  }
  return { headline, detail };
}

export type PriceMovementSignal = "increased" | "decreased" | null;

export function getPriceMovementSignal(
  currentCents: number,
  previousCents: number | null
): PriceMovementSignal {
  if (previousCents == null || previousCents === currentCents) return null;
  if (currentCents > previousCents * 1.005) return "increased";
  if (currentCents < previousCents * 0.995) return "decreased";
  return null;
}

export function priceMovementMessage(signal: PriceMovementSignal): string | null {
  if (signal === "increased") return "Price increased recently";
  if (signal === "decreased") return "Recently reduced price";
  return null;
}

export type HostPriceSuggestion = {
  suggestedPriceCents: number;
  reason: string;
  pctChange: number;
  /** 0–1 heuristic confidence (not a statistical guarantee). */
  confidence: number;
  explanation: string;
} | null;

/** Host-side optimization hint (dashboard). */
export function suggestHostPrice(params: {
  currentPriceCents: number;
  demandScore: number;
}): HostPriceSuggestion {
  const { currentPriceCents, demandScore } = params;
  if (currentPriceCents <= 0) return null;
  if (demandScore >= 82) {
    const pct = 0.06;
    return {
      suggestedPriceCents: Math.round(currentPriceCents * (1 + pct)),
      reason: "High demand detected — consider a modest increase if you want to capture more value",
      pctChange: pct * 100,
      confidence: clamp01((demandScore - 75) / 25),
      explanation:
        "Demand score is elevated versus typical listings. A small price increase may be justified if you are not in a rush to sell — confirm with local comps.",
    };
  }
  if (demandScore <= 22) {
    const pct = 0.1;
    return {
      suggestedPriceCents: Math.round(currentPriceCents * (1 - pct)),
      reason: "Low engagement — consider adjusting price or improving photos",
      pctChange: -pct * 100,
      confidence: clamp01((25 - demandScore) / 25),
      explanation:
        "Engagement signals are soft. A price adjustment or stronger photos/description often improves inquiries — validate against nearby listings.",
    };
  }
  return null;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Threshold-based urgency from real analytics only; returns `null` if signals are insufficient. */
export function getUrgencySignal(
  input: DemandInputs,
  demandScore: number,
  opts?: { lowAvailability?: boolean }
): UrgencyPresentation | null {
  return getUrgencyPresentation(input, demandScore, opts);
}

const GENERIC_REASSURANCE: readonly string[] = [
  "Popular homes in this area often receive questions early — reach out when you are ready.",
  "Listing details are kept current; ask the representative if you need clarification before a visit.",
  "You can explore financing and comparable listings on LECIPM without obligation.",
] as const;

/** Non-numeric, non-statistical reassurance (rotated deterministically). Never implies view counts or guarantees. */
export function getOptionalGenericReassuranceLine(listingId: string): string {
  let h = 0;
  for (let i = 0; i < listingId.length; i++) h = (h + listingId.charCodeAt(i) * (i + 1)) % 100000;
  return GENERIC_REASSURANCE[h % GENERIC_REASSURANCE.length]!;
}
