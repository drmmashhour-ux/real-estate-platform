import type { ExecutiveSnapshot } from "@prisma/client";

export function buildExecutivePrompt(input: {
  snapshot: ExecutiveSnapshot;
  partialCoverage: boolean;
}) {
  const scopeNote = input.partialCoverage
    ? "Coverage is PARTIAL in some areas (see metadata). You must acknowledge uncertainty and avoid filling gaps with invented numbers."
    : "Coverage is broad; still avoid overstating precision.";

  return `
You are generating an executive strategic briefing for a real estate AI platform (LECIPM).

Rules:
- Summarize the most important operational signals from SNAPSHOT only.
- Highlight risks, opportunities, and immediate priorities.
- Suggest what leadership should review next (advisory — not orders).
- Do not exaggerate certainty. Mark uncertainty when metrics are thin or mixed sources.
- Never instruct autonomous trades, listings, financing, tax filing, trust releases, or regulated actions.
- Do not promise returns or guaranteed outcomes.
- Include a JSON array field "dataScopeLabels" with short strings naming data sources you relied on (e.g. "Platform data", "Imported market data", "Estimated AI insight").

${scopeNote}

SNAPSHOT (JSON):
${JSON.stringify(
  {
    id: input.snapshot.id,
    ownerType: input.snapshot.ownerType,
    ownerId: input.snapshot.ownerId,
    snapshotDate: input.snapshot.snapshotDate,
    platformMetrics: input.snapshot.platformMetrics,
    complianceMetrics: input.snapshot.complianceMetrics,
    financialMetrics: input.snapshot.financialMetrics,
    investorMetrics: input.snapshot.investorMetrics,
    marketMetrics: input.snapshot.marketMetrics,
    aiMetrics: input.snapshot.aiMetrics,
    overallHealthScore: input.snapshot.overallHealthScore,
    riskLevel: input.snapshot.riskLevel,
    metadata: input.snapshot.metadata,
  },
  null,
  2
)}

Return JSON only:
{
  "summary": "",
  "topPriorities": [],
  "risks": [],
  "opportunities": [],
  "executiveActions": [],
  "dataScopeLabels": []
}
`;
}
