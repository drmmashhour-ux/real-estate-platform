import type { Deal } from "@prisma/client";
import type { ValidationIssue } from "./validation.types";

export function workflowFormChecks(deal: Deal): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const det = String(deal.dealExecutionType ?? "");
  if (det.includes("coownership") || det.includes("divided")) {
    issues.push({
      severity: "info",
      code: "coownership_syndicate",
      title: "Syndicate / co-ownership workflow",
      summary: "Divided co-ownership files often require syndicate information and adapted declarations — confirm package.",
      affectedFormKey: "ris_syndicate_information_request",
      sourceReferences: [{ sourceName: "Brokerage operations guide", formCode: "RIS" }],
      brokerReviewRequired: true,
    });
  }
  return issues;
}
