/**
 * Pure rollout helpers — no UI. Used by admin/debug surfaces and tests.
 */

export type ConversionRolloutFlags = {
  conversionUpgradeV1: boolean;
  instantValueV1: boolean;
  realUrgencyV1: boolean;
};

export type ConversionExperienceTier =
  | "base"
  | "conversion_only"
  | "conversion_and_instant_value"
  | "conversion_instant_value_urgency";

export function deriveConversionExperienceTier(flags: ConversionRolloutFlags): ConversionExperienceTier {
  if (!flags.conversionUpgradeV1) return "base";
  if (!flags.instantValueV1) return "conversion_only";
  if (!flags.realUrgencyV1) return "conversion_and_instant_value";
  return "conversion_instant_value_urgency";
}

export function conversionExperienceTierLabel(tier: ConversionExperienceTier): string {
  switch (tier) {
    case "base":
      return "Base conversion only (upgrade flags off)";
    case "conversion_only":
      return "Conversion upgrade — trust strip, intake, CTAs (instant-value tiles off)";
    case "conversion_and_instant_value":
      return "Conversion + instant value — insight tiles where surfaces enable them";
    case "conversion_instant_value_urgency":
      return "Conversion + instant value + real urgency — advisory demand signals where wired";
    default:
      return tier;
  }
}

/** Listings explorer top instant-value summary block — both flags required (see LecipmListingsExplorer). */
export function listingsInstantSummaryVisible(flags: ConversionRolloutFlags): boolean {
  return flags.conversionUpgradeV1 && flags.instantValueV1;
}

/** Property detail urgency lines — requires conversion + real urgency + surface builder (see property-conversion-surface). */
export function propertyRealUrgencyLinesVisible(flags: ConversionRolloutFlags): boolean {
  return flags.conversionUpgradeV1 && flags.realUrgencyV1;
}

/** Get-leads: rich insight list under hero — instant value flag must be on. */
export function getLeadsInstantInsightsVisible(flags: ConversionRolloutFlags): boolean {
  return flags.conversionUpgradeV1 && flags.instantValueV1;
}
