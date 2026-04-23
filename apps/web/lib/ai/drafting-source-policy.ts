/**
 * Allow-lists for vector retrieval: only these `sourceKey` rows may ground a draft for a given form bucket.
 */
export function getAllowedSourcesForFormType(formType: string): string[] {
  switch (formType) {
    case "promise_to_purchase":
      return [
        "oaciq_pp_residential",
        "oaciq_annex_r",
        "oaciq_counter_proposal",
        "oaciq_notice_conditions",
        "drafting_book",
        "real_estate_intro_book",
      ];
    case "counter_proposal":
      return [
        "oaciq_counter_proposal",
        "oaciq_pp_residential",
        "oaciq_annex_r",
        "drafting_book",
      ];
    case "annex_r":
      return [
        "oaciq_annex_r",
        "oaciq_pp_residential",
        "oaciq_notice_conditions",
        "drafting_book",
      ];
    case "notice_fulfilment_conditions":
      return [
        "oaciq_notice_conditions",
        "oaciq_pp_residential",
        "oaciq_annex_r",
        "oaciq_counter_proposal",
        "drafting_book",
      ];
    case "seller_declaration":
    case "brokerage_contract":
    case "identity_verification":
    case "disclosure":
      return ["oaciq_other_forms", "drafting_book", "real_estate_intro_book"];
    default:
      return ["drafting_book", "real_estate_intro_book", "oaciq_other_forms"];
  }
}
