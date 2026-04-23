export function buildBuyBoxPrompt(input: {
  buyBox: unknown;
  deal: unknown;
  rationale: unknown;
}): string {
  return `
You are assisting a broker or investor with a buy-box match explanation.

Rules:
- Explain why the property fits or does not fit the stated strategy.
- Mention strengths, weaknesses, and uncertainty where data is limited.
- Do not promise returns, guaranteed profit, or autonomous actions.
- Keep the explanation tied to the metrics and preferences.

BUY BOX:
${JSON.stringify(input.buyBox, null, 2)}

DEAL:
${JSON.stringify(input.deal, null, 2)}

RATIONALE:
${JSON.stringify(input.rationale, null, 2)}

Return JSON only:
{
  "summary": "",
  "strengths": [],
  "risks": [],
  "investorFit": ""
}
`.trim();
}
