export function buildDigestPrompt(data: unknown): string {
  return `
You are generating a daily executive real estate briefing.

Rules:
- Summarize clearly and concisely
- Highlight important changes
- Identify risks and opportunities
- Suggest practical next actions
- Do not claim certainty where data is incomplete
- Base everything on provided data
- Never use guaranteed returns, "risk-free", or certainty of outcomes

DATA:
${JSON.stringify(data, null, 2)}

Return JSON only (no markdown fences) with this shape:
{
  "summary": "",
  "keyHighlights": [],
  "risks": [],
  "opportunities": [],
  "suggestedActions": [],
  "metrics": {}
}
`.trim();
}
