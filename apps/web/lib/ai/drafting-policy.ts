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

/** Semantic score boost by `sourceKey` — aligned with `DRAFTING_SOURCE_REGISTRY` priorities. */
export const SOURCE_PRIORITY: Record<string, number> = Object.fromEntries(
  DRAFTING_SOURCE_REGISTRY.map((s) => [s.key, s.priority]),
);

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
