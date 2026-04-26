/**
 * Listing copy resolution — Arabic is authoritative; English optional with AR fallback.
 */

import type { SyriaProperty } from "@/generated/prisma";
import { pickListingDescription, pickListingTitle } from "@/lib/listing-localized";
import { resolveCityLabel } from "@/lib/syria-locations";

export type SyriaLocaleInput = string;

export type PropertyTitleFields = Pick<SyriaProperty, "titleAr" | "titleEn">;

export type PropertyDescriptionFields = Pick<SyriaProperty, "descriptionAr" | "descriptionEn">;

export type PropertyLocationFields = Pick<
  SyriaProperty,
  "city" | "cityAr" | "cityEn" | "area" | "districtAr" | "districtEn"
>;

export type PropertyLocalizationRow = PropertyTitleFields & PropertyDescriptionFields & PropertyLocationFields;

export function getLocalizedPropertyTitle(row: PropertyTitleFields, locale: SyriaLocaleInput): string {
  try {
    return pickListingTitle(row, locale);
  } catch {
    return typeof row.titleAr === "string" ? row.titleAr : "";
  }
}

export function getLocalizedPropertyDescription(row: PropertyDescriptionFields, locale: SyriaLocaleInput): string {
  try {
    return pickListingDescription(row, locale);
  } catch {
    return typeof row.descriptionAr === "string" ? row.descriptionAr : "";
  }
}

export function getLocalizedPropertyCity(row: PropertyLocationFields, locale: SyriaLocaleInput): string {
  try {
    const en = locale.startsWith("en");
    if (en) {
      const ce = row.cityEn?.trim();
      if (ce) return ce;
      const ca = row.cityAr?.trim();
      if (ca) return ca;
      return resolveCityLabel(row.city, "en");
    }
    const ca = row.cityAr?.trim();
    if (ca) return ca;
    return resolveCityLabel(row.city, "ar");
  } catch {
    return typeof row.city === "string" ? row.city : "";
  }
}

export function getLocalizedPropertyDistrict(row: PropertyLocationFields, locale: SyriaLocaleInput): string | null {
  try {
    const en = locale.startsWith("en");
    if (en) {
      const de = row.districtEn?.trim();
      if (de) return de;
      const da = row.districtAr?.trim();
      if (da) return da;
      const legacy = row.area?.trim();
      return legacy || null;
    }
    const da = row.districtAr?.trim();
    if (da) return da;
    const legacy = row.area?.trim();
    return legacy || null;
  } catch {
    return null;
  }
}
