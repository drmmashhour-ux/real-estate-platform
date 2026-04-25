import { DRAFTING_SOURCE_REGISTRY } from "@/lib/ai/source-registry";
import { getAllowedSourcesForFormType as getAllowedSourcesForFormTypeImpl } from "@/lib/ai/drafting-source-policy";

export type DraftingFormType =
  | "seller_declaration"
  | "brokerage_contract"
  | "promise_to_purchase"
  | "counter_proposal"
  | "annex_r"
  | "notice_fulfilment_conditions"
  | "identity_verification"
  | "disclosure"
  | "other";

/**
 * LECIPM ordering: official OACIQ forms outrank brokerage books in `rankSearchHits`.
 * Overrides registry defaults where the product standard differs.
 */
const LECIPM_SOURCE_PRIORITY: Record<string, number> = {
  oaciq_pp_residential: 100,
  oaciq_counter_proposal: 100,
  oaciq_annex_r: 95,
  oaciq_notice_conditions: 95,
  oaciq_other_forms: 92,
  drafting_book: 80,
  real_estate_intro_book: 70,
};

/** Semantic score boost by `sourceKey` (merged: registry + LECIPM overrides). */
export const SOURCE_PRIORITY: Record<string, number> = {
  ...Object.fromEntries(DRAFTING_SOURCE_REGISTRY.map((s) => [s.key, s.priority])),
  ...LECIPM_SOURCE_PRIORITY,
};

export function getAllowedSourcesForFormType(formType: DraftingFormType): string[] {
  return getAllowedSourcesForFormTypeImpl(formType);
}

/** Map free-form `formType` strings from clients to policy buckets. */
export function normalizeDraftingFormType(formType: string): DraftingFormType {
  const k = formType.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, DraftingFormType> = {
    promise_to_purchase: "promise_to_purchase",
    promesse_achat: "promise_to_purchase",
    pp: "promise_to_purchase",
    counter_proposal: "counter_proposal",
    contre_proposition: "counter_proposal",
    annex_r: "annex_r",
    annex_r_residential: "annex_r",
    notice_fulfilment_conditions: "notice_fulfilment_conditions",
    notice_fulfillment_conditions: "notice_fulfilment_conditions",
    notice_conditions: "notice_fulfilment_conditions",
    seller_declaration: "seller_declaration",
    brokerage_contract: "brokerage_contract",
    identity_verification: "identity_verification",
    id_verification: "identity_verification",
    disclosure: "disclosure",
  };
  return aliases[k] ?? "other";
}
