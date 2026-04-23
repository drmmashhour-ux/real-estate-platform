export function buildInvestorPrompt(input: {
  title: string;
  propertyType?: string | null;
  purchasePriceCents?: number | null;
  monthlyCashflowCents?: number | null;
  capRate?: number | null;
  cashOnCashReturn?: number | null;
  roiPercent?: number | null;
  dscr?: number | null;
  breakEvenOccupancy?: number | null;
}) {
  return `
You are assisting a broker or investor with underwriting analysis.

Rules:
- Summarize investment strengths and weaknesses.
- Explain metrics in clear language.
- Do not promise profit or guaranteed returns.
- Flag weak cashflow, high break-even occupancy, or weak DSCR.

Analysis:
${JSON.stringify(input, null, 2)}

Return JSON:
{
  "summary": "",
  "strengths": [],
  "risks": [],
  "investorTake": ""
}
`;
}
