import type { LegalGraphSummary } from "@/src/modules/legal-intelligence-graph/domain/legalGraph.types";
import { getBlockingIssues } from "@/src/modules/legal-intelligence-graph/application/getBlockingIssues";
import { getRequiredFollowUps } from "@/src/modules/legal-intelligence-graph/application/getRequiredFollowUps";
import { listGraphIssues } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository";

export async function getLegalGraphSummary(propertyId: string): Promise<LegalGraphSummary> {
  const [allIssues, blockers, followUps] = await Promise.all([
    listGraphIssues(propertyId),
    getBlockingIssues(propertyId),
    getRequiredFollowUps(propertyId),
  ]);

  const open = allIssues.filter((i) => i.status === "open");
  const criticalOpenCount = open.filter((i) => i.severity === "critical").length;
  const warnings = open.filter((i) => i.severity === "warning").map((i) => i.message);
  const unresolvedReviewIssues = open.filter((i) => i.issueType.includes("review") || i.issueType.includes("contradiction")).map((i) => i.message);
  const missingDependencies = open.filter((i) => i.issueType === "missing_dependency").map((i) => i.message);
  const signatureBlocked = open.some((i) => i.issueType === "signature_blocker" && i.severity !== "info");

  let fileHealth: LegalGraphSummary["fileHealth"] = "healthy";
  if (open.some((i) => i.severity === "critical")) fileHealth = "critical";
  else if (blockers.length) fileHealth = "blocked";
  else if (warnings.length) fileHealth = "warning";

  return {
    fileHealth,
    blockingIssues: blockers.map((b) => b.message),
    warnings,
    missingDependencies,
    unresolvedReviewIssues,
    criticalOpenCount,
    signatureReadiness: {
      ready: !signatureBlocked,
      reasons: signatureBlocked ? open.filter((i) => i.issueType === "signature_blocker").map((i) => i.message) : ["No signature blockers detected."],
    },
    nextActions: followUps,
  };
}
