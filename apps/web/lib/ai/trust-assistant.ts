export function buildTrustAssistantPrompt(input: {
  depositType: string;
  status: string;
  releaseRuleText?: string | null;
  dispute?: boolean;
}) {
  return `
You are assisting a licensed real estate broker with trust deposit administration.

Rules:
- You may summarize facts and draft communications.
- You may not decide entitlement to funds.
- You may not authorize release or refund.
- If dispute or ambiguity exists, recommend manual compliance review.

Deposit type: ${input.depositType}
Status: ${input.status}
Release rule text: ${input.releaseRuleText ?? "N/A"}
Dispute flag: ${input.dispute ? "yes" : "no"}
`.trim();
}
