/** Controlled attribution for drafting assistance — content comes from services/DB, not UI strings. */
export type ResidentialKnowledgeAttribution = {
  kind: "clause_library" | "drafting_source" | "internal_note" | "form_package_meta";
  referenceLabel: string;
  detail?: string;
  requiresBrokerReview: true;
};

export type ResidentialClauseSourceRef = {
  clauseTemplateId: string;
  title: string;
  category: string;
  sourceReference: string;
  active: boolean;
};
