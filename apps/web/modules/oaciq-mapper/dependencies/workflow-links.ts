/** Non-binding hints for specimen mapper — official packages follow broker / publisher rules. */
export const WORKFLOW_FORM_HINTS: Record<
  string,
  { required: string[]; recommended: string[]; notes: string[] }
> = {
  default: {
    required: ["PP"],
    recommended: ["DS", "IV"],
    notes: ["Residential sale — DS strongly linked to disclosure practice."],
  },
  residential_sale: {
    required: ["PP"],
    recommended: ["DS", "IV"],
    notes: ["DS expected in typical residential sale workflows (specimen mapping)."],
  },
  divided_coownership_sale: {
    required: ["PP"],
    recommended: ["DS", "RIS", "IV"],
    notes: ["Divided co-ownership — RIS linked to syndicate information review."],
  },
  undivided_coownership_sale: {
    required: ["PP"],
    recommended: ["DS", "IV"],
    notes: ["Undivided — verify promise type vs divided co-ownership packages with broker."],
  },
  counter_proposal: {
    required: ["CP"],
    recommended: ["PP"],
    notes: ["CP requires principal PP reference in file."],
  },
  residential_lease: { required: [], recommended: [], notes: ["Lease workflows use different principal forms — verify package."] },
  commercial_lease: { required: [], recommended: [], notes: [] },
  income_property: { required: ["PP"], recommended: ["DS", "IV"], notes: [] },
  purchase_brokerage: { required: [], recommended: ["IV"], notes: [] },
  sale_brokerage: { required: [], recommended: ["IV"], notes: [] },
  amendment: { required: [], recommended: ["CP"], notes: [] },
};
