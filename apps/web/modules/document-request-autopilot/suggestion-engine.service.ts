import { DealRequestCategory } from "@prisma/client";
import type { AutopilotSuggestion } from "./document-request-autopilot.types";
import { expectedCategoriesForStage } from "@/modules/document-requests/request-dependency.service";
import { getTemplateForCategory } from "@/modules/document-requests/request-template.service";

export function suggestBundling(ids: string[]): AutopilotSuggestion | null {
  if (ids.length < 2) return null;
  return {
    type: "bundle_outreach",
    title: "Bundle document requests",
    summary: `You have ${ids.length} open requests — consider one coordinated message (still broker-reviewed).`,
    targetRole: "BROKER",
    urgency: "low",
    reasons: ["Reduce duplicate emails", "Clearer timeline for clients"],
    recommendedAction: "Draft a single update referencing the grouped request IDs in your CRM.",
    brokerApprovalRequired: true,
  };
}
