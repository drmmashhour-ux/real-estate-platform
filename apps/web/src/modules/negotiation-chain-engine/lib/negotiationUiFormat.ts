export function formatMoneyCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatVersionTimestamp(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Short label for financing JSON — factual, no inference beyond keys present. */
export function financingTermsSummary(financingTerms: unknown): string {
  if (financingTerms == null || typeof financingTerms !== "object") return "Not specified";
  const o = financingTerms as Record<string, unknown>;
  if (typeof o.condition === "boolean") return o.condition ? "Conditional financing" : "Non-conditional";
  if (typeof o.conditional === "boolean") return o.conditional ? "Conditional financing" : "Non-conditional";
  if (typeof o.summary === "string" && o.summary.trim()) return o.summary.trim().slice(0, 80);
  return "On file";
}

export function versionTypeLabel(versionNumber: number): string {
  if (versionNumber <= 1) return "Opening offer";
  if (versionNumber === 2) return "Counter-offer";
  return `Counter-offer #${versionNumber}`;
}
