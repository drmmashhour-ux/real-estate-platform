import { prisma } from "@/lib/db";
import type { ContractIntelligenceIssue } from "./contract-intelligence.types";

/**
 * Pulls active clause library rows — traceable to sourceReference; never auto-applies.
 */
export async function buildClauseSuggestionsFromLibrary(jurisdiction: string): Promise<ContractIntelligenceIssue[]> {
  const rows = await prisma.clauseTemplate.findMany({
    where: { active: true, jurisdiction },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({
    severity: "info" as const,
    issueType: "clause_suggestion",
    title: `Clause library: ${r.title}`,
    summary: r.clauseText.slice(0, 280) + (r.clauseText.length > 280 ? "…" : ""),
    suggestedFix: `Source: ${r.sourceReference}`,
    explanation: [
      "Draft suggestion from curated library — broker must adapt to this transaction.",
      "Not legal advice; verify against official form and instructions.",
    ],
    affectedFieldKeys: ["clause_slot"],
    brokerReviewRequired: true as const,
  }));
}
