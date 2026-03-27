export type FraudGraphEdgeType =
  | "shares_media_with"
  | "shares_document_fingerprint_with"
  | "shares_contact_with"
  | "uploaded_by";

export type FraudGraphInvestigationSummary = {
  clusterId: string | null;
  edgeCount: number;
  nodeCount: number;
  escalationRecommended: boolean;
  internalReasonCodes: string[];
};
