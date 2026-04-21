import type { RenoclimatInsulation, RenoclimatWindows } from "./renoclimat.types";

const QC_HINTS =
  /\b(qc|québec|quebec|montreal|montréal|laval|longueuil|gatineau|sherbrooke|trois-rivières|québec city|quebec city|saguenay|drummondville)\b/i;

const NON_QC_HINTS = /\b(ontario|on\b|toronto|ottawa\s+on|calgary|vancouver|bc\b|alberta|manitoba|novascotia)\b/i;

/** Heuristic: user indicates property is in Québec */
export function locationAppearsQuebec(region: string): boolean {
  const s = region.trim();
  if (!s) return false;
  if (NON_QC_HINTS.test(s)) return false;
  return QC_HINTS.test(s) || /^qc$/i.test(s) || /^quebec$/i.test(s) || /^québec$/i.test(s);
}

/** Residential archetypes suitable for owner / small rental retrofit tracks */
export function isResidentialPropertyType(propertyType: string): boolean {
  const p = propertyType.trim().toLowerCase();
  if (!p) return true;
  if (/\b(commercial|industrial|retail|warehouse|office|farm\s+barn)\b/i.test(p)) return false;
  if (/\b(house|condo|condominium|townhouse|duplex|triplex|plex|semi|bungalow|cottage|residential)\b/i.test(p))
    return true;
  return true;
}

export function heatingPotentialScore(heatingType: string | null | undefined): { score: number; tags: string[] } {
  const h = (heatingType ?? "").toLowerCase();
  const tags: string[] = [];
  let score = 0;
  if (h.includes("oil") || h.includes("fioul")) {
    score += 30;
    tags.push("oil_fossil");
  }
  if (h.includes("gas") || h.includes("gaz") || h.includes("propane")) {
    score += 12;
    tags.push("fossil_gas");
  }
  if (h.includes("baseboard") || h.includes("plinthe")) {
    score += 14;
    tags.push("electric_resistance");
  }
  if (h.includes("heat pump") || h.includes("thermopompe")) {
    score -= 12;
    tags.push("heat_pump");
  }
  return { score: Math.max(-15, score), tags };
}

export function insulationPotentialScore(q: RenoclimatInsulation | null | undefined): { score: number; tags: string[] } {
  switch (q ?? "unknown") {
    case "poor":
      return { score: 24, tags: ["insulation_poor"] };
    case "average":
      return { score: 12, tags: ["insulation_average"] };
    case "good":
      return { score: 3, tags: ["insulation_good"] };
    default:
      return { score: 8, tags: ["insulation_unknown"] };
  }
}

export function windowsPotentialScore(w: RenoclimatWindows | null | undefined): { score: number; tags: string[] } {
  switch (w ?? "unknown") {
    case "single":
      return { score: 20, tags: ["windows_single"] };
    case "double":
      return { score: 8, tags: ["windows_double"] };
    case "triple_high_performance":
      return { score: 0, tags: ["windows_high_perf"] };
    default:
      return { score: 8, tags: ["windows_unknown"] };
  }
}

export function agePotentialScore(yearBuilt: number | null | undefined): { score: number; tags: string[] } {
  if (yearBuilt == null || yearBuilt <= 0) return { score: 8, tags: ["age_unknown"] };
  const age = new Date().getFullYear() - yearBuilt;
  if (age >= 55) return { score: 22, tags: ["legacy_building"] };
  if (age >= 40) return { score: 18, tags: ["older_building"] };
  if (age >= 25) return { score: 12, tags: ["mid_age_building"] };
  if (age >= 12) return { score: 6, tags: ["recent_build"] };
  return { score: 2, tags: ["newer_build"] };
}

export function sumPotentialScore(parts: number[]): number {
  const raw = parts.reduce((a, b) => a + b, 0);
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function levelFromPotentialScore(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 52) return "HIGH";
  if (score >= 28) return "MEDIUM";
  return "LOW";
}
