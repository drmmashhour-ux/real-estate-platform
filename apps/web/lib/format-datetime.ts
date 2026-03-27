/**
 * Readable timestamps for dashboards (demo + production).
 */

export function formatDemoDateTime(input: Date | string | null | undefined, locale = "en-CA"): string {
  if (input == null) return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDemoDate(input: Date | string | null | undefined, locale = "en-CA"): string {
  if (input == null) return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, { dateStyle: "medium" });
}
