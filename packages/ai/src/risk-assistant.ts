export function buildRiskAssistantPrompt(input: Record<string, unknown>) {
  return `
You are assisting with compliance risk monitoring.

Rules:
- Highlight risks
- Suggest preventive actions
- Do not take enforcement decisions
- Do not imply that a score alone authorizes blocking users or funds

Data:
${JSON.stringify(input, null, 2)}
`.trim();
}
