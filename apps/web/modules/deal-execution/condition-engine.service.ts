/**
 * Maps internal deal condition strings to execution-step hints (assistive only).
 */
export function summarizeConditionsForDeal(conditions: Array<{ label?: string; status?: string } | string>) {
  return conditions.map((c) => (typeof c === "string" ? { label: c, status: "unknown" } : { label: c.label ?? "—", status: c.status ?? "unknown" }));
}
