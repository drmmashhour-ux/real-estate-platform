import type { GreenEngineInput, GreenImprovement } from "@/modules/green/green.types";
import type { GrantTag, QuebecGrantRecord } from "./grants.data";

function lower(s: string): string {
  return s.toLowerCase();
}

/** Infer tags from a single improvement row (keyword mapping). */
export function inferTagsFromImprovementAction(action: string): GrantTag[] {
  const a = lower(action);
  const tags = new Set<GrantTag>();

  if (a.includes("heat pump") || a.includes("thermopompe")) tags.add("heat_pump");
  if (a.includes("insulation") || a.includes("attic") || a.includes("wall")) tags.add("insulation_envelope");
  if (a.includes("window") || a.includes("glazing")) tags.add("windows_glazing");
  if (a.includes("solar") || a.includes("pv")) tags.add("solar_pv");
  if (a.includes("hrv") || a.includes("erv") || a.includes("ventilation")) tags.add("ventilation_hrv_erv");
  if (a.includes("air sealing") || a.includes("air seal")) tags.add("air_sealing");
  if (a.includes("thermostat") || a.includes("zoning")) tags.add("deep_retrofit");

  return [...tags];
}

/** Property-level signals that unlock transition / audit-style programs */
export function inferTagsFromProperty(input: GreenEngineInput): GrantTag[] {
  const tags = new Set<GrantTag>();
  const heat = lower(input.heatingType ?? "");

  if (heat.includes("oil") || heat.includes("fioul")) tags.add("oil_heating_transition");
  /* Do not tag every home with heat_pump — that would attach HP grants to all rows. Heat pump eligibility comes from upgrade text. */
  if (input.insulationQuality === "poor" || input.atticInsulationQuality === "poor" || input.wallInsulationQuality === "poor") {
    tags.add("insulation_envelope");
    tags.add("energy_audit");
  }
  if (input.windowsQuality === "single" || input.windowsQuality === "unknown") {
    tags.add("windows_glazing");
  }
  /* Solar grant matching is driven by the “Add solar PV” recommendation, not by “no PV yet” alone. */
  if (input.envelopeRetrofitYearsAgo != null && input.envelopeRetrofitYearsAgo > 12) {
    tags.add("deep_retrofit");
  }

  return [...tags];
}

export function unionTags(upgrades: GreenImprovement[], property: GreenEngineInput): GrantTag[] {
  const set = new Set<GrantTag>();
  for (const u of upgrades) {
    for (const t of inferTagsFromImprovementAction(u.action)) set.add(t);
  }
  for (const t of inferTagsFromProperty(property)) set.add(t);
  return [...set];
}

/** Grant matches if any eligibility tag appears in the candidate tag set */
export function grantMatchesRecord(grant: QuebecGrantRecord, candidateTags: ReadonlySet<GrantTag>): boolean {
  return grant.eligibility.some((t) => candidateTags.has(t));
}

/** Per recommendation: grant applies if it matches combined tags and at least one eligibility tag maps to this action line. */
export function grantsForAction(action: string, property: GreenEngineInput, catalog: QuebecGrantRecord[]): QuebecGrantRecord[] {
  const actionTags = new Set(inferTagsFromImprovementAction(action));
  const propertyTags = new Set(inferTagsFromProperty(property));
  const combined = new Set<GrantTag>([...actionTags, ...propertyTags]);

  return catalog.filter(
    (g) => grantMatchesRecord(g, combined) && g.eligibility.some((t) => actionTags.has(t)),
  );
}
