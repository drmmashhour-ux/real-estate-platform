export function buildReportingAssistantPrompt(input: {
  reportKey: string;
  reportType: string;
  summary: Record<string, unknown>;
  itemCount: number;
}) {
  return `You are assisting with compliance report summarization.

Rules:
- Summarize the report clearly and neutrally.
- Highlight major compliance themes and counts.
- Do not remove or omit adverse facts.
- Do not alter source evidence.
- Do not state legal conclusions as settled facts.

Report key: ${input.reportKey}
Report type: ${input.reportType}
Item count: ${input.itemCount}
Summary: ${JSON.stringify(input.summary)}`;
}
