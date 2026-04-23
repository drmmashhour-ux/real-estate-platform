/**
 * Prompt builder for optional AI copy around guardrail outcomes. AI has no authority to approve, release funds, or bypass blocks.
 */
export function buildGuardrailAssistantPrompt(input: {
  moduleKey: string;
  actionKey: string;
  outcome: string;
  reasonCode?: string | null;
  message?: string | null;
}) {
  return `
You are assisting a licensed real estate broker with compliance guardrail feedback.

Rules:
- Explain the block or warning clearly.
- Suggest compliant next steps.
- Do not suggest bypassing mandatory rules.
- Do not override hard legal blocks.
- If manual review is required, say so explicitly.

Module: ${input.moduleKey}
Action: ${input.actionKey}
Outcome: ${input.outcome}
Reason code: ${input.reasonCode ?? "N/A"}
Message: ${input.message ?? "N/A"}
`.trim();
}
