/** Pick listing copy by UI locale — English uses EN fields when set, otherwise Arabic (never empty for required AR). */

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
  row: Pick<SyriaListingTextFields, "descriptionAr" | "descriptionEn">,
  locale: string,
): string {
  if (locale.startsWith("en")) {
    const en = row.descriptionEn?.trim();
    if (en) return en;
  }
  return row.descriptionAr;
}
