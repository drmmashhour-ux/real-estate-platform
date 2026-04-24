import type { GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import type { GuestBehaviorSignals, GuestContext, GuestTripPreference } from "./context.types";

const KNOWN: ReadonlySet<GuestTripPreference> = new Set([
  "luxury",
  "family",
  "business",
  "budget",
  "pet_friendly",
  "quiet",
]);

export function parseGuestPreferenceTags(raw: string[] | string | undefined | null): GuestTripPreference[] {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[;,]/);
  const out: GuestTripPreference[] = [];
  for (const x of arr) {
    const t = x
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_") as GuestTripPreference;
    if (KNOWN.has(t)) out.push(t);
  }
  return [...new Set(out)];
}

function preferencesFromStaysFeatures(features: string[]): GuestTripPreference[] {
  const out: GuestTripPreference[] = [];
  const f = new Set(features.map((x) => x.toLowerCase()));
  if (f.has("pet_friendly")) out.push("pet_friendly");
  return out;
}

export function buildGuestContextForStaysSearch(args: {
  filters: GlobalSearchFiltersExtended;
  behaviorSignals: GuestBehaviorSignals;
  /** From assistant panel or API query */
  preferenceTags?: GuestTripPreference[];
}): GuestContext {
  const min = args.filters.priceMin > 0 ? args.filters.priceMin : undefined;
  const max = args.filters.priceMax > 0 ? args.filters.priceMax : undefined;
  const fromFeatures = preferencesFromStaysFeatures(args.filters.features);
  const prefs = [...new Set([...(args.preferenceTags ?? []), ...fromFeatures])];

  return {
    location: args.filters.location?.trim() || null,
    checkIn: args.filters.checkIn?.trim() || null,
    checkOut: args.filters.checkOut?.trim() || null,
    guestCount: args.filters.guests ?? null,
    budgetRange: min != null || max != null ? { min, max } : undefined,
    preferences: prefs.length ? prefs : undefined,
    behaviorSignals: args.behaviorSignals,
  };
}
