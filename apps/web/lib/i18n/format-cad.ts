import type { LocaleCode } from "@/lib/i18n/types";

/** CAD in major units (dollars), Québec-style grouping for French (`fr-CA`). */
export function formatCadMajorUnits(amount: number, locale: LocaleCode, currency = "CAD"): string {
  const tag = locale === "fr" ? "fr-CA" : "en-CA";
  return new Intl.NumberFormat(tag, { style: "currency", currency }).format(amount);
}
