import type { ReadinessLevel } from "@prisma/client";

export type MortgageReadinessSafeDto = {
  readinessLabel: "Not Ready" | "Partially Ready" | "Ready for Review" | "Action Required";
  missingDocumentCount: number;
  blockingIssues: string[];
  nextBestActions: string[];
};

export type MortgageReadinessAdminDto = MortgageReadinessSafeDto & {
  overallScore: number | null;
  readinessLevel: ReadinessLevel | null;
  ruleSummary: string[];
};

function labelFromReadiness(rl: ReadinessLevel | null): MortgageReadinessSafeDto["readinessLabel"] {
  switch (rl) {
    case "ready":
      return "Ready for Review";
    case "partial":
      return "Partially Ready";
    case "action_required":
      return "Action Required";
    default:
      return "Not Ready";
  }
}

export function toMortgageReadinessDtos(args: {
  readinessLevel: ReadinessLevel | null;
  overallScore: number | null;
  failedRuleCodes: string[];
}): { safe: MortgageReadinessSafeDto; admin: MortgageReadinessAdminDto } {
  const readinessLabel = labelFromReadiness(args.readinessLevel);
  const missingDocumentCount = args.failedRuleCodes.filter((c) => c.includes("MANDATORY") || c.includes("DOCUMENTS")).length;

  const nextBestActions: string[] = [];
  if (args.failedRuleCodes.some((c) => c.includes("INCOME"))) nextBestActions.push("Upload proof of income");
  if (args.failedRuleCodes.some((c) => c.includes("MANDATORY"))) nextBestActions.push("Complete required application fields");
  if (args.failedRuleCodes.some((c) => c.includes("DOCUMENTS"))) nextBestActions.push("Add employment and credit band details");
  if (args.failedRuleCodes.some((c) => c.includes("LIABILITY"))) nextBestActions.push("Review liabilities section");

  const blockingIssues = args.failedRuleCodes.map((c) => `Rule ${c} needs attention`);

  const safe: MortgageReadinessSafeDto = {
    readinessLabel,
    missingDocumentCount,
    blockingIssues: blockingIssues.slice(0, 6),
    nextBestActions: nextBestActions.slice(0, 6),
  };

  const admin: MortgageReadinessAdminDto = {
    ...safe,
    overallScore: args.overallScore,
    readinessLevel: args.readinessLevel,
    ruleSummary: args.failedRuleCodes,
  };

  return { safe, admin };
}
