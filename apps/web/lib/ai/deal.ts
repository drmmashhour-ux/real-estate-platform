export function buildDealPrompt(input: Record<string, unknown>) {
  return `
Analyze this real estate investment opportunity (advisory context — human must decide; no autonomous action):

${JSON.stringify(input, null, 2)}

Explain:
- why this opportunity might be worth review (or not)
- risks and uncertainty (especially if lowConfidence is true)
- investor profile fit (who might want to dig deeper)
- angles to validate in diligence (not "hidden" guaranteed upside)

Return JSON:
{
  "summary": "",
  "strengths": [],
  "risks": [],
  "investorFit": ""
}
`;
}
