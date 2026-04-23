import type { BnhubListingForRanking } from "@/lib/ai/bnhub-search";

export type MemoryRankHint = {
  topLocations: { location: string; score: number }[];
  topPropertyTypes: { propertyType: string; score: number }[];
  sessionCity?: string | null;
  esgInterestLevel?: number;
  urgencyScore?: number;
  activeVsPassive?: string;
};

function normLoc(s: string) {
  return s.trim().toLowerCase();
}

/**
 * Builds a bounded, explainable hint object from `getMemorySignalsForEngine` output.
 */
export function buildMemoryRankHintFromSignals(
  signals: Record<string, unknown> | null | undefined,
): MemoryRankHint | null {
  if (!signals || signals.personalizationEnabled !== true) return null;

  const pref = signals.preferenceSummary as
    | {
        topLocations?: { location: string; score: number }[];
        topPropertyTypes?: { propertyType: string; score: number }[];
      }
    | undefined;

  const sess = signals.sessionIntent as { city?: string; focusCity?: string } | null | undefined;
  const esg = signals.esgProfile as { interestLevel?: number } | null | undefined;
  const intent = signals.intentSummary as { urgencyScore?: number } | undefined;
  const beh = signals.behaviorSummary as { activeVsPassive?: string } | undefined;

  const sessionCity = sess?.city ?? sess?.focusCity ?? null;
  const topLocations = pref?.topLocations ?? [];
  const topPropertyTypes = pref?.topPropertyTypes ?? [];
  const esgInterestLevel = esg?.interestLevel;

  if (
    topLocations.length === 0 &&
    topPropertyTypes.length === 0 &&
    !sessionCity?.trim() &&
    (esgInterestLevel ?? 0) <= 0
  ) {
    return null;
  }

  return {
    topLocations: topLocations.slice(0, 5),
    topPropertyTypes: topPropertyTypes.slice(0, 5),
    sessionCity,
    esgInterestLevel,
    urgencyScore: intent?.urgencyScore,
    activeVsPassive: beh?.activeVsPassive,
  };
}

/**
 * 0–1 affinity score for how well a listing matches memory (used for bounded score nudges only).
 */
export function memoryListingAffinity01(
  listing: Pick<BnhubListingForRanking, "city" | "region" | "propertyType">,
  hint: MemoryRankHint,
): number {
  let boost = 0;

  if (hint.sessionCity?.trim()) {
    const sc = normLoc(hint.sessionCity);
    const lc = normLoc(listing.city ?? "");
    const lr = normLoc(listing.region ?? "");
    if (lc && (lc === sc || lc.includes(sc) || sc.includes(lc))) boost += 0.45;
    else if (lr && (lr === sc || lr.includes(sc) || sc.includes(lr))) boost += 0.25;
  }

  for (const loc of hint.topLocations) {
    const l = normLoc(loc.location);
    const lc = normLoc(listing.city ?? "");
    const lr = normLoc(listing.region ?? "");
    if (!l) continue;
    const w = Math.min(0.35, (loc.score / 100) * 0.35);
    if (lc && (lc === l || lc.includes(l) || l.includes(lc))) {
      boost += w;
      break;
    }
    if (lr && (lr === l || lr.includes(l) || l.includes(lr))) {
      boost += w * 0.6;
      break;
    }
  }

  const pt = normLoc(listing.propertyType ?? "");
  if (pt) {
    for (const t of hint.topPropertyTypes) {
      const x = normLoc(t.propertyType);
      if (x && (pt === x || pt.includes(x) || x.includes(pt))) {
        boost += Math.min(0.25, (t.score / 100) * 0.25);
        break;
      }
    }
  }

  return Math.min(1, boost);
}

export function preferredCityFromMemorySignals(signals: Record<string, unknown> | null | undefined): string | null {
  const hint = buildMemoryRankHintFromSignals(signals);
  if (!hint) return null;
  if (hint.sessionCity?.trim()) return hint.sessionCity.trim();
  return hint.topLocations[0]?.location?.trim() ?? null;
}
