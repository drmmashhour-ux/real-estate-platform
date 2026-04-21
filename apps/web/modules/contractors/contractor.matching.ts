import type { ContractorServiceSlug } from "./contractor.model";

/** Map free-text upgrade recommendations (from green engine) to service slugs */
export function upgradeRecommendationsToServiceTags(actions: string[]): ContractorServiceSlug[] {
  const set = new Set<ContractorServiceSlug>();

  for (const raw of actions) {
    const a = raw.toLowerCase();
    if (a.includes("insulation") || a.includes("attic") || a.includes("wall") || a.includes("envelope")) {
      set.add("insulation");
    }
    if (a.includes("heat pump") || a.includes("thermopompe") || a.includes("hvac")) {
      set.add("heat_pump");
    }
    if (a.includes("roof") || a.includes("toiture") || a.includes("green roof")) {
      set.add("roofing");
    }
    if (a.includes("solar") || a.includes("pv") || a.includes("photovoltaic")) {
      set.add("solar_pv");
    }
    if (a.includes("window") || a.includes("glazing") || a.includes("fenêtre")) {
      set.add("windows");
    }
    if (a.includes("hrv") || a.includes("erv") || a.includes("ventilation")) {
      set.add("ventilation");
    }
    if (a.includes("air sealing") || a.includes("air seal") || a.includes("étanchéité")) {
      set.add("air_sealing");
    }
  }

  return [...set];
}

/** Broad Québec coverage: province-wide contractors match any QC city filter */
export function regionMatchesContractor(contractorRegion: string, filterRegion: string | null | undefined): boolean {
  const cr = contractorRegion.trim().toLowerCase();
  const fr = (filterRegion ?? "").trim().toLowerCase();
  if (!fr) return true;
  if (cr === fr) return true;
  if (cr === "quebec" || cr === "qc" || cr === "québec") return true;
  if (fr === "quebec" || fr === "qc" || fr === "québec") return true;
  if (fr.includes("montreal") || fr.includes("montréal")) {
    return cr.includes("montreal") || cr.includes("montréal") || cr === "quebec" || cr === "qc" || cr === "québec";
  }
  return cr.includes(fr) || fr.includes(cr);
}

export function overlapScore(contractorServices: string[], wantedTags: Set<string>): number {
  let n = 0;
  for (const s of contractorServices) {
    if (wantedTags.has(s)) n += 1;
  }
  return n;
}
