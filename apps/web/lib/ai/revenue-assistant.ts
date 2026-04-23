export type RevenueAssistantInput = {
  commission?: unknown;
  gst?: unknown;
  qst?: unknown;
};

/**
 * Copilot context for commission / tax review — summaries and flags only; no autonomous tax math or payment approval.
 */
export function buildRevenueAssistantPrompt(input: RevenueAssistantInput) {
  return `
You are assisting a broker with commission and tax tracking.

Rules:
- Do not calculate final values autonomously
- Do not approve payments
- Highlight inconsistencies

Commission: ${String(input.commission ?? "")}
GST: ${String(input.gst ?? "")}
QST: ${String(input.qst ?? "")}
`.trim();
}
