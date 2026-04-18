import type { ExactValidationIssue } from "../mapper.types";
import type { CanonicalDealShape } from "../source-paths/canonical-deal-shape";

export function numericConsistencyIssues(canonical: CanonicalDealShape): ExactValidationIssue[] {
  const issues: ExactValidationIssue[] = [];
  const price = canonical.deal.price.purchasePrice;
  const dep = canonical.deal.deposit.amount;
  if (typeof price === "number" && typeof dep === "number" && dep > price) {
    issues.push({
      severity: "critical",
      code: "numeric.deposit_exceeds_price",
      message: "Deposit amount exceeds purchase price in canonical data — correct before broker review.",
      brokerReviewRequired: true,
    });
  }
  return issues;
}
