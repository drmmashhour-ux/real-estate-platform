/**
 * Québec-oriented clause stems — assistive only; broker/counsel must validate.
 * Every clause carries a stable rule id for traceability in `rationaleJson`.
 */
export const OFFER_CLAUSE_LIBRARY = {
  financing: {
    ruleId: "qc_financing_condition_standard_v1",
    template:
      "This promise is conditional upon the BUYER obtaining, within {{financing_days}} calendar days of acceptance, a written commitment from a recognized financial institution for a mortgage loan in an amount and on terms satisfactory to the BUYER. If financing is not obtained, the BUYER may declare this promise null and void by written notice within the stated delay, without penalty save as to deposits governed by law.",
  },
  inspection: {
    ruleId: "qc_inspection_condition_standard_v1",
    template:
      "This promise is conditional upon the BUYER obtaining, within {{inspection_days}} calendar days of acceptance, an inspection report satisfactory to the BUYER at the BUYER's sole discretion. If unsatisfied, the BUYER may declare this promise null and void by written notice within the stated delay.",
  },
  occupancy: {
    ruleId: "qc_occupancy_possession_v1",
    template:
      "Possession / occupancy shall be {{occupancy_terms}}. Adjustments shall be made as customary in Québec for municipal taxes, condominium common expenses (if any), fuel, and utilities.",
  },
  conditionalSale: {
    ruleId: "qc_conditional_sale_buyer_property_v1",
    template:
      "This promise is conditional upon the BUYER obtaining a binding agreement for the sale of the BUYER's present property within {{conditional_days}} calendar days, failing which the BUYER may declare this promise null and void by written notice.",
  },
  brokerDisclosure: {
    ruleId: "oaciq_broker_disclosure_ack_v1",
    template:
      "The parties acknowledge that the broker's mandatory disclosure obligations under applicable Québec brokerage regulations have been or will be satisfied in writing as required before binding acceptance.",
  },
  conflictDisclosure: {
    ruleId: "oaciq_conflict_disclosure_v1",
    template:
      "The parties acknowledge that a situation requiring conflict-of-interest disclosure has been identified in the brokerage file. The parties confirm they have received the required disclosure and accept the broker's continued involvement on the terms documented in the brokerage record.",
  },
} as const;

export type OfferClauseKey = keyof typeof OFFER_CLAUSE_LIBRARY;

export function renderClauseTemplate(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

export function defaultInclusions(): { item: string; sourceRuleId: string }[] {
  return [
    { item: "Fixtures and equipment customarily considered immovable by law", sourceRuleId: "inclusion_immeuble_par_destination_v1" },
    { item: "Heating / cooling equipment serving the unit", sourceRuleId: "inclusion_hvac_v1" },
    { item: "Window coverings and rods (unless excluded)", sourceRuleId: "inclusion_window_coverings_v1" },
  ];
}

export function defaultExclusions(): { item: string; sourceRuleId: string }[] {
  return [
    { item: "Seller's personal effects and movable property", sourceRuleId: "exclusion_personal_effects_v1" },
    { item: "Items listed as excluded in the brokerage listing file", sourceRuleId: "exclusion_per_listing_file_v1" },
  ];
}
