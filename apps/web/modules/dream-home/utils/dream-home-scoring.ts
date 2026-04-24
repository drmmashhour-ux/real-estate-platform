import type { DreamHomeMatchedListing, DreamHomeProfile, DreamHomeRankingPreferences } from "../types/dream-home.types";

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);

type ListingFeatures = {
  bedrooms: number | null;
  bathrooms: number | null;
  description: string;
  title: string;
  city: string;
  priceCents: number;
};

/**
 * Suggested bedroom / bathroom minimums from declared household and hosting (deterministic, explicit inputs only).
 */
export function suggestBedroomBathMinimums(p: {
  familySize?: number;
  childrenCount?: number;
  eldersInHome?: boolean;
  guestsFrequency?: "low" | "medium" | "high";
}): { minBedrooms: number; minBathrooms: number } {
  const fs = p.familySize != null && Number.isFinite(p.familySize) ? Math.max(1, Math.min(20, p.familySize)) : 2;
  const ch = p.childrenCount != null && Number.isFinite(p.childrenCount) ? Math.max(0, p.childrenCount) : 0;
  const guestBoost = p.guestsFrequency === "high" ? 1 : p.guestsFrequency === "medium" ? 0.5 : 0;
  const elderBoost = p.eldersInHome ? 0.5 : 0;
  const minBedrooms = Math.min(8, Math.max(1, Math.ceil(fs * 0.4 + ch * 0.35 + guestBoost + elderBoost * 0.2)));
  const minBathrooms = Math.min(6, Math.max(1, Math.floor(minBedrooms / 2) + (p.guestsFrequency === "high" ? 1 : 0)));
  return { minBedrooms, minBathrooms };
}

function levelToWeight(low: number, med: number, high: number, v?: "low" | "medium" | "high" | null): number {
  if (v === "low") {
    return low;
  }
  if (v === "medium") {
    return med;
  }
  if (v === "high") {
    return high;
  }
  return med;
}

/**
 * Map questionnaire-style priorities to normalized ranking weights (sum ≈ 1; clamped per dimension).
 */
export function buildDefaultRankingPreferences(input: {
  privacyPreference?: "low" | "medium" | "high";
  hostingPreference?: "low" | "medium" | "high";
  workFromHome?: "none" | "sometimes" | "full_time";
  kitchenPriority?: "low" | "medium" | "high";
  outdoorPriority?: "low" | "medium" | "high";
  noiseTolerance?: "low" | "medium" | "high" | string;
  familySize?: number;
  childrenCount?: number;
  pets?: boolean;
  accessibilityNeeds?: string[];
}): DreamHomeRankingPreferences {
  const familyN =
    (input.familySize != null && Number.isFinite(input.familySize) ? input.familySize : 0) +
    (input.childrenCount != null && Number.isFinite(input.childrenCount) ? input.childrenCount * 0.4 : 0) +
    (input.pets ? 0.05 : 0) +
    (Array.isArray(input.accessibilityNeeds) && input.accessibilityNeeds.length > 0 ? 0.08 : 0);

  const weightFamilyFunctionality = clamp01(0.12 + 0.04 * Math.min(familyN, 8));
  const weightPrivacy = levelToWeight(0.04, 0.08, 0.14, input.privacyPreference);
  const weightHosting = levelToWeight(0.05, 0.1, 0.16, input.hostingPreference);
  const wfh =
    input.workFromHome === "full_time" ? 0.16 : input.workFromHome === "sometimes" ? 0.1 : 0.05;
  const weightWorkFromHome = clamp01(wfh);
  const weightKitchen = levelToWeight(0.04, 0.08, 0.12, input.kitchenPriority);
  const weightOutdoor = levelToWeight(0.04, 0.08, 0.12, input.outdoorPriority);
  const noise = input.noiseTolerance;
  const weightQuietness =
    noise === "low" || noise === "quiet" ? 0.14 : noise === "medium" || noise === "moderate" ? 0.08 : 0.04;
  const weightStyleFit = 0.1;
  const acc = Array.isArray(input.accessibilityNeeds) && input.accessibilityNeeds.length > 0 ? 0.12 : 0.04;
  const weightAccessibility = clamp01(acc);
  // Renormalize rough sum to 1
  const sum =
    weightPrivacy +
    weightHosting +
    weightFamilyFunctionality +
    weightKitchen +
    weightOutdoor +
    weightWorkFromHome +
    weightAccessibility +
    weightQuietness +
    weightStyleFit;
  const n = (x: number) => (sum > 0 ? x / sum : x);
  return {
    weightPrivacy: n(weightPrivacy),
    weightHosting: n(weightHosting),
    weightFamilyFunctionality: n(weightFamilyFunctionality),
    weightKitchen: n(weightKitchen),
    weightOutdoor: n(weightOutdoor),
    weightWorkFromHome: n(weightWorkFromHome),
    weightAccessibility: n(weightAccessibility),
    weightQuietness: n(weightQuietness),
    weightStyleFit: n(weightStyleFit),
  };
}

export type LifestyleFitBreakdown = {
  total: number;
  parts: { key: string; value: number; reason: string }[];
};

/**
 * 0-1 fit from listing text + bedroom match vs user priorities (no AI).
 */
export function scoreListingLifestyleFit(
  profile: DreamHomeProfile,
  listing: ListingFeatures,
  weights: DreamHomeRankingPreferences,
): LifestyleFitBreakdown {
  const text = `${listing.title} ${listing.description} ${listing.city}`.toLowerCase();
  const privacyWords = /separate|suite|ensuite|private|split|corner|fenced|hedge|quiet/i;
  const hostWords = /open|kitchen|island|dining|deck|patio|entertain/i;
  const wfhWords = /office|den|workspace|bureau|quiet floor/i;
  const kitWords = /kitchen|granite|island|pantry/i;
  const outWords = /yard|garden|balcony|terrace|patio|deck|pool/i;
  const a11yWords = /step|elevator|accessible|ramp|single.floor|one.level|ground/i;
  const famWords = /bedroom|bdrm|beds|basement|family|play|mudroom|laundry/i;
  const style = (profile.searchFilters.keywords ?? []).join(" ").toLowerCase();
  const styleHit = style.length > 2 && text.split(/\s+/).some((w) => w.length > 3 && style.includes(w) && text.includes(w));

  const pPriv = privacyWords.test(text) ? 1 : 0.25;
  const pHost = hostWords.test(text) ? 1 : 0.25;
  const pWfh = wfhWords.test(text) ? 1 : 0.2;
  const pKit = kitWords.test(text) ? 1 : 0.2;
  const pOut = outWords.test(text) ? 1 : 0.2;
  const pA11y = a11yWords.test(text) ? 1 : 0.2;
  const pQuiet = /quiet|cul.de|calm|residential|tree/i.test(text) ? 0.9 : 0.35;
  const pFam = famWords.test(text) ? 0.85 : 0.3;
  const pStyle = styleHit ? 0.9 : 0.4;

  const parts: LifestyleFitBreakdown["parts"] = [
    { key: "privacy", value: pPriv, reason: privacyWords.test(text) ? "Listing text mentions private / separated layout cues." : "Weak explicit privacy signals in the listing text." },
    { key: "hosting", value: pHost, reason: hostWords.test(text) ? "Gathering or kitchen/entertainment signals in description." : "Limited hosting-related keywords in the listing text." },
    { key: "wfh", value: pWfh, reason: wfhWords.test(text) ? "Possible workspace or office-friendly hints." : "No clear workspace cues in the text." },
    { key: "kitchen", value: pKit, reason: kitWords.test(text) ? "Kitchen-focused description." : "Kitchen not emphasized in text." },
    { key: "outdoor", value: pOut, reason: outWords.test(text) ? "Outdoor or yard/terrace cues present." : "Little outdoor language in the listing text." },
    { key: "a11y", value: pA11y, reason: a11yWords.test(text) ? "Accessibility-related cues in text." : "No accessibility language detected (verify with visits)." },
    { key: "quiet", value: pQuiet, reason: pQuiet > 0.5 ? "Quieter or residential wording." : "Urban/busy tone possible — confirm on visit." },
    { key: "familyFunctionality", value: pFam, reason: pFam > 0.5 ? "Multipurpose or bedroom emphasis." : "Functional fit depends on room mix — confirm floor plan." },
    { key: "style", value: pStyle, reason: styleHit ? "Description overlaps with your style keywords." : "Style match is generic — refine style keywords in your profile." },
  ];

  const w = weights;
  const total =
    w.weightPrivacy * pPriv +
    w.weightHosting * pHost +
    w.weightWorkFromHome * pWfh +
    w.weightKitchen * pKit +
    w.weightOutdoor * pOut +
    w.weightAccessibility * pA11y +
    w.weightQuietness * pQuiet +
    w.weightFamilyFunctionality * pFam +
    w.weightStyleFit * pStyle;
  return { total: clamp01(total), parts };
}

export function scoreFilterFit(
  f: DreamHomeProfile["searchFilters"],
  listing: Pick<ListingFeatures, "bedrooms" | "bathrooms" | "priceCents">,
): { score: number; notes: string[] } {
  const minB = f.minBedrooms ?? f.bedroomsMin;
  const minBa = f.minBathrooms ?? f.bathroomsMin;
  const minPrice = f.budgetMin != null && f.budgetMin > 0 ? f.budgetMin * 100 : null;
  const maxPrice =
    f.budgetMax != null && f.budgetMax > 0
      ? f.budgetMax * 100
      : f.maxBudget != null && f.maxBudget > 0
        ? f.maxBudget * 100
        : null;
  const notes: string[] = [];
  let s = 0.5;
  if (minB != null && listing.bedrooms != null) {
    s += listing.bedrooms >= minB ? 0.25 : 0.05;
    if (listing.bedrooms < minB) {
      notes.push(`Bedrooms below your stated minimum (${minB}+).`);
    } else {
      notes.push("Bedroom count meets or exceeds your minimum.");
    }
  } else {
    notes.push("Bedroom minimum not set or missing on listing; neutral filter fit.");
  }
  if (minBa != null && listing.bathrooms != null) {
    s += listing.bathrooms >= minBa ? 0.1 : 0;
    if (listing.bathrooms < minBa) {
      notes.push(`Bathrooms below your minimum (${minBa}+).`);
    }
  }
  if (maxPrice != null) {
    if (listing.priceCents <= maxPrice) {
      s += 0.2;
      notes.push("Price within your stated range.");
    } else {
      notes.push("Price is above your stated cap — check budget flexibility.");
    }
  }
  if (minPrice != null && listing.priceCents < minPrice) {
    s -= 0.05;
    notes.push("Below minimum budget (if you set a floor) — may indicate tradeoffs (condition, location).");
  }
  return { score: clamp01(s), notes };
}

/**
 * Blended 0-1 match score: filter fit + lifestyle fit. Explainable, deterministic.
 */
export function scoreListingMatch(
  profile: DreamHomeProfile,
  listing: ListingFeatures,
  options?: { filterWeight?: number; lifestyleWeight?: number; playbookBoost?: number },
): { matchScore: number; scoreBreakdown: NonNullable<DreamHomeMatchedListing["scoreBreakdown"]> } {
  const fw = options?.filterWeight ?? 0.45;
  const lw = options?.lifestyleWeight ?? 0.55;
  const pb = clamp01(options?.playbookBoost ?? 0);
  const w = profile.rankingPreferences ?? buildDefaultRankingPreferences({});
  const life = scoreListingLifestyleFit(profile, listing, w);
  const filt = scoreFilterFit(profile.searchFilters, listing);
  const raw = clamp01(filt.score * fw + life.total * lw + pb * 0.04);
  return {
    matchScore: raw,
    scoreBreakdown: {
      filterFit: filt.score,
      lifestyleFit: life.total,
      keywordFit: life.parts.find((x) => x.key === "style")?.value ?? 0,
      explanation: [...filt.notes, ...life.parts.map((p) => `${p.key}: ${p.reason}`).slice(0, 5)],
    },
  };
}
