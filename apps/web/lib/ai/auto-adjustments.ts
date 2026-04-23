export function buildAutoAdjustmentPrompt(input: {
  subject: Record<string, unknown>;
  comparable: Record<string, unknown>;
  differences: Record<string, unknown>;
  ruleBasedSuggestions: unknown[];
}) {
  return `
You are assisting a licensed broker with appraisal adjustment support.

Rules:
- Propose adjustments conservatively.
- Explain rationale clearly.
- Do not claim certainty where evidence is limited.
- Do not finalize a certified appraisal.
- Use the differences and rule-based suggestions as anchors.
- Return JSON only.

SUBJECT:
${JSON.stringify(input.subject, null, 2)}

COMPARABLE:
${JSON.stringify(input.comparable, null, 2)}

DIFFERENCES:
${JSON.stringify(input.differences, null, 2)}

RULE-BASED SUGGESTIONS:
${JSON.stringify(input.ruleBasedSuggestions, null, 2)}

RETURN:
{
  "adjustments": [
    {
      "adjustmentType": "",
      "label": "",
      "suggestedAmountCents": 0,
      "direction": "plus",
      "rationale": "",
      "confidence": 0.0,
      "sourceType": "ai_assist"
    }
  ],
  "summary": "",
  "warnings": []
}
`.trim();
}
