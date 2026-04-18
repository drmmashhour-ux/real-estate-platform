/**
 * Suggested pipeline transitions — broker confirms before updating Lead rows.
 */
export function suggestPipelineTransition(current: string): { next: string; note: string } | null {
  const c = current.toLowerCase();
  if (c === "new") return { next: "contacted", note: "Log first human touch (call/email)." };
  if (c === "contacted" || c === "follow_up") return { next: "qualified", note: "Promote when budget + timeline are confirmed." };
  return null;
}
