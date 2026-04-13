import type { CoordinationTargetRole } from "@prisma/client";

export type AutopilotSuggestion = {
  type: "missing_documents" | "overdue" | "lender_follow_up" | "notary_prep" | "bundle_outreach";
  title: string;
  summary: string;
  targetRole: CoordinationTargetRole;
  urgency: "low" | "medium" | "high";
  reasons: string[];
  recommendedAction: string;
  brokerApprovalRequired: true;
  templateCategory?: string;
};
