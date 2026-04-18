import type { ValidationIssue } from "./validation.types";

export function attachComplianceCopy(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.map((i) => ({
    ...i,
    summary: `${i.summary} (Assistive check — not legal sufficiency.)`,
  }));
}
