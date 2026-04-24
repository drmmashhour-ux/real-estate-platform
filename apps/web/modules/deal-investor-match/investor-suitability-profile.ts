/**
 * Heuristic parse of AMF suitability JSON — keys vary by intake version.
 */
export type ParsedInvestorSuitability = {
  minTicketCents: number | null;
  maxTicketCents: number | null;
  preferredCities: string[];
  propertyTypes: string[];
  /** 1 = low, 2 = medium, 3 = high appetite */
  riskTier: number | null;
  esgFocus: boolean;
  valueAddInterest: boolean;
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function readCents(o: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const raw = o[k];
    const n = num(raw);
    if (n != null && n > 0) {
      if (n < 500_000) return Math.round(n * 100);
      return Math.round(n);
    }
  }
  return null;
}

function readStringArray(o: Record<string, unknown>, keys: string[]): string[] {
  for (const k of keys) {
    const raw = o[k];
    if (Array.isArray(raw)) {
      return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
    }
    if (typeof raw === "string" && raw.trim()) {
      return raw
        .split(/[,;|]/g)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function readRiskTier(o: Record<string, unknown>): number | null {
  const keys = ["riskTolerance", "maxRisk", "riskAppetite", "riskLevel"];
  for (const k of keys) {
    const raw = o[k];
    if (typeof raw === "string") {
      const s = raw.toLowerCase();
      if (s.includes("low") || s === "1") return 1;
      if (s.includes("medium") || s.includes("moderate") || s === "2") return 2;
      if (s.includes("high") || s === "3") return 3;
    }
    const n = num(raw);
    if (n === 1 || n === 2 || n === 3) return n;
  }
  return null;
}

export function readExemptionPreferenceFromSuitability(suitabilityIntakeJson: unknown): string | null {
  if (!suitabilityIntakeJson || typeof suitabilityIntakeJson !== "object") return null;
  const o = suitabilityIntakeJson as Record<string, unknown>;
  const keys = ["exemptionPath", "selectedExemption", "preferredExemption", "exemptionCategory", "privateExemption"];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export function parseInvestorSuitabilityProfile(suitabilityIntakeJson: unknown): ParsedInvestorSuitability {
  if (!suitabilityIntakeJson || typeof suitabilityIntakeJson !== "object") {
    return {
      minTicketCents: null,
      maxTicketCents: null,
      preferredCities: [],
      propertyTypes: [],
      riskTier: null,
      esgFocus: false,
      valueAddInterest: false,
    };
  }
  const o = suitabilityIntakeJson as Record<string, unknown>;
  const minTicketCents = readCents(o, ["minTicketCents", "minInvestmentCents", "minimumTicketCents"]);
  let maxTicketCents = readCents(o, ["maxTicketCents", "maxInvestmentCents", "maximumTicketCents"]);
  if (maxTicketCents != null && minTicketCents != null && maxTicketCents < minTicketCents) {
    maxTicketCents = minTicketCents;
  }
  const preferredCities = readStringArray(o, ["preferredCities", "cities", "targetMarkets", "markets", "focusCities"]);
  const propertyTypes = readStringArray(o, ["propertyTypes", "assetTypes", "preferredPropertyTypes"]);
  const riskTier = readRiskTier(o);
  const esgRaw = o.esgFocus ?? o.esgPriority ?? o.climateAligned ?? o.sustainabilityFocus;
  const esgFocus = esgRaw === true || (typeof esgRaw === "string" && /^(yes|true|high|priority)/i.test(esgRaw.trim()));
  const strat = readStringArray(o, ["strategy", "strategies", "investmentStyle"]);
  const valueAddInterest = strat.some((s) => /value|add|renovat|retrofit/i.test(s));
  return {
    minTicketCents,
    maxTicketCents,
    preferredCities,
    propertyTypes,
    riskTier,
    esgFocus,
    valueAddInterest,
  };
}

export function dealRiskTierFromDeal(riskLevel: string | null | undefined): number {
  const s = (riskLevel ?? "").toLowerCase();
  if (s.includes("high")) return 3;
  if (s.includes("low")) return 1;
  return 2;
}

export function inferDealCityHints(listingTitle: string | null | undefined, executionMetadata: unknown): string[] {
  const hints: string[] = [];
  const title = (listingTitle ?? "").toLowerCase();
  const metro = ["laval", "montreal", "montréal", "quebec", "québec", "gatineau", "longueuil"];
  for (const m of metro) {
    if (title.includes(m)) hints.push(m);
  }
  if (hints.length === 0 && typeof executionMetadata === "object" && executionMetadata !== null) {
    const o = executionMetadata as Record<string, unknown>;
    const c = o.dealCity ?? o.marketCity ?? o.city;
    if (typeof c === "string" && c.trim()) hints.push(c.trim().toLowerCase());
  }
  return hints;
}

export function dealInvestmentTargetCents(priceCents: number, executionMetadata: unknown): number {
  if (typeof executionMetadata === "object" && executionMetadata !== null) {
    const v = (executionMetadata as Record<string, unknown>).investmentTargetCents;
    if (typeof v === "number" && v > 0) return Math.round(v);
  }
  return Math.round(priceCents * 0.25);
}
