/**
 * Declarative cross-form rules for the dependency engine (specimen / draft assistance).
 */

export type DependencyRule = {
  id: string;
  when: (ctx: { activeFormKeys: Set<string>; hasPpRef: boolean; isDivided: boolean; hasExistingLoan: boolean }) => boolean;
  blockingMissingForms: string[];
  recommendedForms: string[];
  notes: string[];
};

export const OACIQ_DEPENDENCY_RULES: DependencyRule[] = [
  {
    id: "cp_needs_pp_ref",
    when: ({ activeFormKeys, hasPpRef }) => activeFormKeys.has("CP") && !hasPpRef,
    blockingMissingForms: ["PP_REFERENCE"],
    recommendedForms: [],
    notes: ["Counter-proposal mapping should reference principal PP form number."],
  },
  {
    id: "divided_suggests_ris",
    when: ({ isDivided, activeFormKeys }) => isDivided && !activeFormKeys.has("RIS"),
    blockingMissingForms: [],
    recommendedForms: ["RIS"],
    notes: ["Divided co-ownership file — RIS commonly used for syndicate information (not a legal assertion)."],
  },
  {
    id: "existing_loan_suggests_rh",
    when: ({ hasExistingLoan, activeFormKeys }) => hasExistingLoan && !activeFormKeys.has("RH"),
    blockingMissingForms: [],
    recommendedForms: ["RH"],
    notes: ["Existing financing data — RH may support lender information review."],
  },
];
