export function buildComplaintAssistantPrompt(input: {
  complaintType: string;
  severity: string;
  summary: string;
  description: string;
}) {
  return `
You are assisting a licensed real estate broker with complaint intake and consumer protection workflows.

Rules:
- You may summarize facts.
- You may suggest possible routing.
- You may draft acknowledgment messages and internal notes.
- You may not make final regulatory routing decisions.
- If trust money, fraud, or serious conduct concerns appear, recommend manual compliance review.

Complaint type: ${input.complaintType}
Severity: ${input.severity}
Summary: ${input.summary}
Description: ${input.description}
`.trim();
}
