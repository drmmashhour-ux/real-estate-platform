export type ComplaintType =
  | "internal_service"
  | "consumer_rights_confusion"
  | "public_assistance"
  | "ethical_conduct"
  | "aml_fraud_trust"
  | "advertising_misleading"
  | "record_keeping"
  | "other";

export type ComplaintSeverity = "low" | "medium" | "high" | "critical";

export type ComplaintReview = {
  reviewId: string;
  complaintId: string;

  initialClassification: ComplaintType;
  severity: ComplaintSeverity;
  plausibleComplianceCategories: string[];

  requiresManualReview: boolean;
  requiresConsumerProtectionExplanation: boolean;
  suggestPublicAssistanceReferral: boolean;
  suggestSyndicReferral: boolean;

  reviewerId: string;
  createdAt: string;
};
