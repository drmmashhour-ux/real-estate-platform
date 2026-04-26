/** Canonical Hadiah Link product strings for UI (i18n messages may extend per locale). */

export const DARLINK_COPY = {
  en: {
    name: "Hadiah Link",
    nameAr: "هدية لينك",
    tagline: "Trusted real estate & short stays for Syria",
  },
  ar: {
    name: "هدية لينك",
    nameEn: "Hadiah Link",
    tagline: "منصة عقار وإقامات قصيرة موثوقة في سوريا",
  },
} as const;

/** Bilingual lockup: primary = locale line 1, secondary = other script. */
export function getHadiahBrandLockup(locale: string): { primary: string; secondary: string; secondaryDir: "ltr" | "rtl" } {
  if (locale.startsWith("ar")) {
    return { primary: DARLINK_COPY.ar.name, secondary: DARLINK_COPY.ar.nameEn, secondaryDir: "ltr" };
  }
  return { primary: DARLINK_COPY.en.name, secondary: DARLINK_COPY.en.nameAr, secondaryDir: "rtl" };
}
