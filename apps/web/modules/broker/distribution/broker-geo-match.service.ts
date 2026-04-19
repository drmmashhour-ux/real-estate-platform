/**
 * Deterministic broker ↔ lead geo match — never excludes brokers; minimum score preserves fallback.
 */

import type { BrokerServiceArea } from "@/modules/broker/profile/broker-profile.types";
import type { LeadLocation } from "@/modules/lead/lead-location.types";

export type GeoMatchType = "exact_city" | "area_match" | "same_region" | "nearby" | "none";

const SCORE: Record<GeoMatchType, number> = {
  area_match: 1,
  exact_city: 0.9,
  same_region: 0.55,
  nearby: 0.3,
  none: 0.12,
};

export function normGeoKey(s: string | null | undefined): string {
  if (!s?.trim()) return "";
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const QC_CITY_KEYS = new Set([
  "quebec city",
  "quebec",
  "québec",
  "ville de quebec",
  "ville de québec",
  "montreal",
  "montréal",
  "laval",
  "gatineau",
  "sherbrooke",
  "trois-rivieres",
  "trois rivieres",
]);

/** Map broker-declared city strings to province codes — uses explicit broker wording only (no lead fabrication). */
const CITY_HINT_PROVINCE = new Map<string, string>(
  [
    [["montreal", "montréal"], "QC"],
    [["toronto", "mississauga", "ottawa", "hamilton"], "ON"],
    [["calgary", "edmonton"], "AB"],
    [["vancouver", "victoria"], "BC"],
    [["winnipeg"], "MB"],
    [["regina", "saskatoon"], "SK"],
    [["halifax"], "NS"],
    [["fredericton", "moncton", "saint john"], "NB"],
    [["quebec city", "quebec", "québec", "laval", "gatineau", "sherbrooke"], "QC"],
  ].flatMap(([keys, prov]) => (keys as string[]).map((k) => [normGeoKey(k), prov] as const)),
);

export function cityCanonicalKey(city: string | null | undefined): string {
  const k = normGeoKey(city);
  if (!k) return "";
  if (QC_CITY_KEYS.has(k)) {
    if (k.startsWith("quebec") || k.includes("québec")) return "qc-city-core";
    return k;
  }
  return k;
}

function citiesAlign(leadCity: string | null | undefined, brokerCity: string): boolean {
  const a = cityCanonicalKey(leadCity);
  const b = cityCanonicalKey(brokerCity);
  if (!leadCity?.trim() || !brokerCity.trim()) return false;
  if (a === b) return true;
  if (a === "qc-city-core" && b === "qc-city-core") return true;
  if (a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

function areasAlign(leadArea: string | null | undefined, brokerArea: string | null | undefined): boolean {
  if (!leadArea?.trim() || !brokerArea?.trim()) return false;
  const a = normGeoKey(leadArea);
  const b = normGeoKey(brokerArea);
  return a === b || (a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a)));
}

function inferredProvinceFromBrokerCity(brokerCity: string): string | null {
  const k = normGeoKey(brokerCity);
  return CITY_HINT_PROVINCE.get(k) ?? null;
}

function rankOrder(t: GeoMatchType): number {
  const order: GeoMatchType[] = ["area_match", "exact_city", "same_region", "nearby", "none"];
  return order.indexOf(t);
}

export type GeoMatchResult = {
  matchType: GeoMatchType;
  geoScore: number;
  explanation: string;
};

/**
 * Best geo fit across declared service areas. Quebec leads match Québec-declared cities via alias + QC province hints.
 */
export function computeGeoMatch(leadLocation: LeadLocation, brokerServiceAreas: BrokerServiceArea[]): GeoMatchResult {
  const empty: GeoMatchResult = {
    matchType: "none",
    geoScore: SCORE.none,
    explanation: "No strong location match — fallback ranking still applies.",
  };

  if (!brokerServiceAreas.length) {
    return {
      ...empty,
      explanation: "Broker has no declared service areas — neutral geo signal.",
    };
  }

  let best: GeoMatchResult = empty;

  const leadCity = leadLocation.city?.trim() || null;
  const leadArea = leadLocation.area?.trim() || null;
  const leadProv = leadLocation.province?.trim().toUpperCase() || null;

  for (const svc of brokerServiceAreas) {
    const brokerCity = svc.city?.trim();
    if (!brokerCity) continue;

    let matchType: GeoMatchType = "none";
    let explanation = "";

    const cityHit = Boolean(leadCity) && citiesAlign(leadCity, brokerCity);
    const areaHit =
      Boolean(leadArea && svc.area?.trim()) &&
      citiesAlign(leadCity, brokerCity) &&
      areasAlign(leadArea, svc.area ?? null);

    if (areaHit) {
      matchType = "area_match";
      explanation = `Primary service area match (${brokerCity}${svc.area ? ` · ${svc.area}` : ""}).`;
    } else if (cityHit) {
      matchType = "exact_city";
      explanation = `Same city coverage (${brokerCity}).`;
    } else if (leadProv) {
      const bp = inferredProvinceFromBrokerCity(brokerCity);
      if (bp && bp === leadProv) {
        matchType = "same_region";
        explanation =
          leadCity && leadProv === "QC"
            ? `Same region (${leadProv}) — Quebec coverage without exact city overlap in profile.`
            : `Same region (${leadProv}) — broader coverage.`;
      }
    }

    const candidate: GeoMatchResult = {
      matchType,
      geoScore: SCORE[matchType],
      explanation:
        matchType === "none"
          ? "No strong location match — fallback ranking still applies."
          : explanation,
    };

    if (
      candidate.geoScore > best.geoScore ||
      (candidate.geoScore === best.geoScore && rankOrder(candidate.matchType) < rankOrder(best.matchType))
    ) {
      best = candidate;
    }
  }

  return best;
}
