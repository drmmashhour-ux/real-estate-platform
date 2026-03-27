import { listGraphIssues } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository";

export async function getRequiredFollowUps(propertyId: string) {
  const issues = await listGraphIssues(propertyId);
  return issues
    .filter((i) => i.status === "open")
    .map((i) => `${i.title}: ${i.message}`)
    .slice(0, 12);
}
