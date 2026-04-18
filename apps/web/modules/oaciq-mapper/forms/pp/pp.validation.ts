import type { ExactValidationIssue, MapFormResult } from "../../mapper.types";
import type { CanonicalDealShape } from "../../source-paths/canonical-deal-shape";

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v) || 0;
  return 0;
}

export function validatePp(map: MapFormResult, _canonical: CanonicalDealShape): ExactValidationIssue[] {
  const issues: ExactValidationIssue[] = [];
  const m = map.mappedFields;
  const total = num(m["pp.p5.totalPrice"]);
  const sum =
    num(m["pp.p5.deposit"]) +
    num(m["pp.p5.additionalSum"]) +
    num(m["pp.p5.newLoan"]) +
    num(m["pp.p5.existingLoan"]) +
    num(m["pp.p5.balance"]);

  if (total > 0 && sum > 0 && Math.abs(sum - total) > 0.02 * total && Math.abs(sum - total) > 500) {
    issues.push({
      severity: "warning",
      code: "pp.method.total_match",
      formKey: "PP",
      message: "Method of payment components do not reconcile to total price — broker review.",
      brokerReviewRequired: true,
    });
  }

  const dep = num(m["pp.p4.depositAmount"]);
  if (dep > 0) {
    if (!m["pp.p4.depositTiming"] || String(m["pp.p4.depositTiming"]).trim() === "") {
      issues.push({
        severity: "warning",
        code: "pp.deposit.timing",
        fieldKey: "pp.p4.depositTiming",
        formKey: "PP",
        message: "Deposit amount set — confirm timing on official form.",
        brokerReviewRequired: true,
      });
    }
    if (!m["pp.p4.depositMethod"] || String(m["pp.p4.depositMethod"]).trim() === "") {
      issues.push({
        severity: "warning",
        code: "pp.deposit.method",
        fieldKey: "pp.p4.depositMethod",
        formKey: "PP",
        message: "Deposit amount set — confirm payment method / trust instructions.",
        brokerReviewRequired: true,
      });
    }
  }

  return issues;
}
