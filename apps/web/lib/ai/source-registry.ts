export type DraftingSourceKey =
  | "drafting_book"
  | "real_estate_intro_book"
  | "oaciq_pp_residential"
  | "oaciq_counter_proposal"
  | "oaciq_annex_r"
  | "oaciq_notice_conditions"
  | "oaciq_other_forms";

export type DraftingSource = {
  key: DraftingSourceKey;
  label: string;
  type: "book" | "official_form" | "official_notice" | "official_annex";
  priority: number;
};

export const DRAFTING_SOURCE_REGISTRY: DraftingSource[] = [
  {
    key: "drafting_book",
    label: "Drafting / clause standards book",
    type: "book",
    priority: 100,
  },
  {
    key: "real_estate_intro_book",
    label: "Introduction to Residential Real Estate Brokerage",
    type: "book",
    priority: 90,
  },
  {
    key: "oaciq_pp_residential",
    label: "OACIQ Promise to Purchase – Residential Immovable",
    type: "official_form",
    priority: 110,
  },
  {
    key: "oaciq_counter_proposal",
    label: "OACIQ Counter-Proposal",
    type: "official_form",
    priority: 110,
  },
  {
    key: "oaciq_annex_r",
    label: "OACIQ Annex R – Residential Immovable",
    type: "official_annex",
    priority: 105,
  },
  {
    key: "oaciq_notice_conditions",
    label: "OACIQ Notice – Follow-up of Fulfilment of Conditions",
    type: "official_notice",
    priority: 105,
  },
  {
    key: "oaciq_other_forms",
    label: "Other official OACIQ forms in library",
    type: "official_form",
    priority: 80,
  },
];

const SOURCE_BY_KEY: Record<string, DraftingSource> = Object.fromEntries(
  DRAFTING_SOURCE_REGISTRY.map((s) => [s.key, s]),
);

export function getDraftingSourceMeta(sourceKey: string): DraftingSource | undefined {
  return SOURCE_BY_KEY[sourceKey];
}
