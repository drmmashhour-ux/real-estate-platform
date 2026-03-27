import { listGraphIssues } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository";

export async function getBlockingIssues(propertyId: string) {
  const issues = await listGraphIssues(propertyId);
  return issues.filter((i) => i.status === "open" && (i.severity === "critical" || i.issueType.includes("blocker")));
}
