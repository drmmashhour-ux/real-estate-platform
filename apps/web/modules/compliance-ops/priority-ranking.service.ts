import type { ComplianceCase, ComplianceCaseSeverity } from "@prisma/client";

const rank: Record<ComplianceCaseSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function rankComplianceCases(cases: ComplianceCase[]): ComplianceCase[] {
  return [...cases].sort((a, b) => {
    const dr = rank[b.severity] - rank[a.severity];
    if (dr !== 0) return dr;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
