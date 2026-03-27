import { listGraphIssues } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository";

export async function traverseOpenIssues(propertyId: string) {
  const all = await listGraphIssues(propertyId);
  return all.filter((i) => i.status === "open");
}
