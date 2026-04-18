import type { ValidationIssue } from "@/modules/validation/validation.types";

export function assessExportReadiness(issues: ValidationIssue[]): {
  ready: boolean;
  blockingReasons: string[];
} {
  const critical = issues.filter((i) => i.severity === "critical");
  return {
    ready: critical.length === 0,
    blockingReasons: critical.map((c) => c.title),
  };
}
