/**
 * Lightweight field-touch summary for broker review — not a legal redline engine.
 */
export function summarizeFieldChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>
): { fieldKeysTouched: string[]; note: string } {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after)]);
  const touched: string[] = [];
  for (const k of keys) {
    const b = before?.[k];
    const a = after[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) touched.push(k);
  }
  return {
    fieldKeysTouched: touched,
    note:
      touched.length === 0
        ? "No structured field changes detected (compare versions manually)."
        : `Structured fields changed: ${touched.slice(0, 12).join(", ")}${touched.length > 12 ? "…" : ""}.`,
  };
}
