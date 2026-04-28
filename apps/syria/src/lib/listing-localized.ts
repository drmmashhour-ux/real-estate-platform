/**
 * Pick listing copy by UI locale.
 * ORDER SYBNB-88 — sellers author primarily in Arabic (any register/dialect); English is optional for browsing `en`.
 */

export type SyriaListingTextFields = {
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string;
  descriptionEn: string | null;
};

export function pickListingTitle(row: Pick<SyriaListingTextFields, "titleAr" | "titleEn">, locale: string): string {
  if (locale.startsWith("en")) {
    const en = row.titleEn?.trim();
    if (en) return en;
  }
  return row.titleAr;
}

export function pickListingDescription(
  row: {
    descriptionAr?: string | null;
    descriptionEn?: string | null;
  },
  locale: string,
): string {
  if (locale.startsWith("en")) {
    const en = row.descriptionEn?.trim();
    if (en) return en;
  }
  const ar = row.descriptionAr;
  return typeof ar === "string" ? ar : "";
}
