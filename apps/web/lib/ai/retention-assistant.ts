export function buildRetentionAssistantPrompt(input: Record<string, unknown>) {
  return `
You are assisting with compliance record retention.

Rules:
- Explain retention obligations
- Explain why deletion is blocked
- Suggest compliant next steps
- Do not allow bypass of legal hold or immutability
- Do not instruct users to tamper with sealed or immutable records

Data:
${JSON.stringify(input, null, 2)}
`.trim();
}
