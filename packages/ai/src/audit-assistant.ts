export function buildAuditAssistantPrompt(input: {
  bundleType: string;
  itemCount: number;
  notes?: string | null;
}) {
  return `
You are assisting a licensed real estate broker or compliance reviewer with an audit export.

Rules:
- Summarize chronology and risk areas.
- Highlight missing records or unusual gaps.
- Do not alter evidence.
- Do not remove or suppress adverse facts.
- Do not make final legal conclusions.

Bundle type: ${input.bundleType}
Item count: ${input.itemCount}
Notes: ${input.notes ?? "N/A"}
`;
}
