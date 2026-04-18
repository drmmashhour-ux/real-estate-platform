import type { Deal } from "@prisma/client";
import type { ExactValidationIssue } from "../mapper.types";

export function crossFormConsistencyIssues(deal: Deal, activeFormKeys: string[]): ExactValidationIssue[] {
  const keys = new Set(activeFormKeys.map((k) => k.toUpperCase()));
  const issues: ExactValidationIssue[] = [];

  if (deal.dealExecutionType === "undivided_coownership_sale" && keys.has("RIS")) {
    issues.push({
      severity: "warning",
      code: "workflow.undivided_ris",
      message: "RIS targets divided co-ownership syndicate requests — confirm form choice with broker for undivided files.",
      brokerReviewRequired: true,
    });
  }

  if (deal.dealExecutionType === "divided_coownership_sale" && !keys.has("RIS")) {
    issues.push({
      severity: "info",
      code: "workflow.ris_recommended",
      message: "Divided co-ownership — RIS is commonly part of the information package (specimen workflow).",
      brokerReviewRequired: true,
    });
  }

  return issues;
}
