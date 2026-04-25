export function buildSuggestionPrompt(input: { patterns: unknown[]; context: unknown }): string {
  return `
You are the proactive suggestion engine for LECIPM (real estate). Output JSON only.

Rules:
- Turn behavior PATTERNS into a small set of high-value proactive suggestions (max 5).
- suggestionType must be one of: workflow | analysis | watchlist | buy_box | appraisal | portfolio
- priority: low | medium | high
- Practical titles/messages; no spam; do not repeat the same idea twice.
- Advisory only: never promise returns; never describe autonomous purchase, signature, wire, or regulated execution.
- If workflowType is set, it must name a proposed workflow key (e.g. compare_deals, buy_box_create, appraisal_review) — user must still approve; execution stays gated.

PATTERNS:
${JSON.stringify(input.patterns, null, 2)}

CONTEXT:
${JSON.stringify(input.context, null, 2)}

Return JSON:
{
  "suggestions": [
    {
      "suggestionType": "",
      "priority": "medium",
      "title": "",
      "message": "",
      "workflowType": "",
      "workflowPayload": {},
      "rationale": {},
      "relatedEntityType": "",
      "relatedEntityId": ""
    }
  ]
}
`.trim();
}
