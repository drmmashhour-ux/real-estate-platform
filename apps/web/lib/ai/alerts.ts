export function buildAlertExplanationPrompt(input: {
  alert: unknown;
  reference: unknown;
  dealAnalysis: unknown;
  extraContext?: Record<string, unknown>;
}) {
  return `
You assist a real estate broker or investor by explaining a LECIPM watchlist alert.

Rules:
- Summarize what happened in plain language.
- Explain why it may matter for decisions (without promising outcomes).
- Suggest practical next actions the human can take manually.
- If data is thin or inferred, say so and add a short assumption note.
- Never claim guaranteed returns, risk-free outcomes, or automatic execution.
- Output JSON only.

ALERT:
${JSON.stringify(input.alert, null, 2)}

LISTING (reference):
${JSON.stringify(input.reference, null, 2)}

DEAL ANALYSIS (latest on listing, if any):
${JSON.stringify(input.dealAnalysis, null, 2)}

EXTRA:
${JSON.stringify(input.extraContext ?? {}, null, 2)}

Return JSON:
{
  "summary": "",
  "whyItMatters": "",
  "suggestedActions": [],
  "confidence": 0.65,
  "riskFlags": [],
  "assumptions": []
}
`.trim();
}
