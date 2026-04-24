/**
 * Maps drafting `formType` strings to ProductionGuard registry keys when they align.
 */
export function mapDraftFormTypeToProductionGuardKey(formType: string): string | null {
  const t = formType.trim().toLowerCase();
  if (t.includes("promise") && t.includes("purchase")) return "lecipm_promise_to_purchase";
  if (t.includes("brokerage") && (t.includes("ack") || t.includes("acknowledg"))) return "lecipm_brokerage_ack";
  if (t === "lecipm_promise_to_purchase" || t === "lecipm_brokerage_ack") return formType.trim();
  return null;
}
