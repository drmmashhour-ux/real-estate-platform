import type { ExactValidationIssue } from "../mapper.types";
import { runDependencyEngine } from "../dependencies/dependency-engine";
import type { Deal } from "@prisma/client";
import type { CanonicalDealShape } from "../source-paths/canonical-deal-shape";

export function dependencyValidationIssues(
  deal: Deal,
  canonical: CanonicalDealShape,
  activeFormKeys: string[],
): ExactValidationIssue[] {
  const dep = runDependencyEngine(deal, canonical, activeFormKeys);
  const issues: ExactValidationIssue[] = [];
  for (const b of dep.blockingMissingForms) {
    issues.push({
      severity: "critical",
      code: "dependency.blocking",
      message: `Dependency gap: ${b} — resolve before treating mapping as complete.`,
      brokerReviewRequired: true,
    });
  }
  return issues;
}
