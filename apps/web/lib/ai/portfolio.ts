export function buildPortfolioPrompt(input: { properties: unknown[]; totalValue: number; totalCashflow: number }) {
  return `
Analyze this real estate portfolio (advisory only — not investment advice; human review required).

${JSON.stringify(input, null, 2)}

Return:
- summary
- strengths
- weaknesses
- optimization suggestions

Do not promise returns. Flag data gaps and underwriting items to verify.
`;
}
