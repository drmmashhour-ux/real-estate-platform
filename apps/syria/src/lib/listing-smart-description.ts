/**
 * ORDER SYBNB-68 — deterministic Arabic-first fallback copy when the seller adds **no** description.
 * ORDER SYBNB-88 — optional English for bilingual UI only; sellers may leave Arabic-only casual copy.
 * ORDER SYBNB-91 — when the seller wrote any non-empty description, we never replace it with formal broker prose server-side.
 */

import { formatSyriaCurrency } from "@/lib/format";
import type { SyriaPropertyType } from "@/generated/prisma";
import { LISTING_MIN_DESCRIPTION_AR_CHARS } from "@/lib/listing-quality";
import { SYRIA_AMENITIES, normalizeSyriaAmenityKeys, sortSyriaAmenityKeysForListingDisplay } from "@/lib/syria/amenities";

/** True only when the seller left no usable text — SYBNB-88 preserves short/casual Arabic without overwriting. */
export function listingNeedsSmartArabicDescription(descriptionAr: string | null | undefined): boolean {
  const s = typeof descriptionAr === "string" ? descriptionAr.trim() : "";
  return s.length === 0 || s === "—";
}

function joinArabicWa(parts: string[]): string {
  const p = parts.filter(Boolean);
  if (p.length === 0) return "";
  if (p.length === 1) return p[0]!;
  if (p.length === 2) return `${p[0]} و${p[1]}`;
  return `${p.slice(0, -1).join("، ")} و${p[p.length - 1]}`;
}

function amenityLabels(keys: string[], lang: "ar" | "en"): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const row = SYRIA_AMENITIES.find((a) => a.key === k);
    if (!row) continue;
    out.push(lang === "ar" ? row.label_ar : row.label_en);
  }
  return out;
}

export type SmartListingDescriptionInput = {
  cityAr: string | null | undefined;
  cityCanonicalEn: string;
  area: string | null | undefined;
  price: string | number | { toString(): string };
  currency?: string;
  amenities: unknown;
  type: SyriaPropertyType;
};

export function buildSmartListingDescriptionArEn(input: SmartListingDescriptionInput): {
  descriptionAr: string;
  descriptionEn: string | null;
} {
  const cityAr = input.cityAr?.trim() || "";
  const cityEn = input.cityCanonicalEn.trim();
  const cityDisplayAr = cityAr || cityEn;
  const area = input.area?.trim() || "";
  const locAr = area ? `${cityDisplayAr} (${area})` : cityDisplayAr;
  const locEn = area ? `${cityEn} (${area})` : cityEn;

  const rawAmenities = Array.isArray(input.amenities)
    ? input.amenities.filter((x): x is string => typeof x === "string")
    : [];
  const sortedKeys = sortSyriaAmenityKeysForListingDisplay(normalizeSyriaAmenityKeys(rawAmenities)).slice(0, 4);
  const labelsAr = amenityLabels(sortedKeys, "ar");
  const labelsEn = amenityLabels(sortedKeys, "en");

  const currency = input.currency ?? "SYP";
  const priceFmtAr = formatSyriaCurrency(input.price, currency, "ar");

  let openerAr: string;
  let openerEn: string;
  let purposeAr: string;
  let purposeEn: string;

  switch (input.type) {
    case "HOTEL":
      openerAr = `إقامة فندقية في ${locAr}`;
      openerEn = `Hotel-style stay in ${locEn}`;
      purposeAr = "مناسبة للإقامة اليومية أو السياحية";
      purposeEn = "well suited for daily stays or tourism";
      break;
    case "BNHUB":
      openerAr = `إقامة قصيرة في ${locAr}`;
      openerEn = `Short stay in ${locEn}`;
      purposeAr = "مناسبة للإقامة اليومية";
      purposeEn = "ideal for short daily stays";
      break;
    case "RENT":
      openerAr = `مسكن للإيجار في ${locAr}`;
      openerEn = `Rental home in ${locEn}`;
      purposeAr = "مناسبة للسكن اليومي";
      purposeEn = "suited for everyday living";
      break;
    default:
      openerAr = `عرض في ${locAr}`;
      openerEn = `Listing in ${locEn}`;
      purposeAr = "للتواصل للتفاصيل والمعاينة";
      purposeEn = "contact for details or a viewing";
  }

  const amenitiesAr =
    labelsAr.length > 0 ? `مزودة بـ ${joinArabicWa(labelsAr)}` : "يمكن استكمال تفاصيل المرافق عبر التواصل";
  const amenitiesEn =
    labelsEn.length > 0 ? `includes ${labelsEn.join(", ")}` : "contact for amenity details";

  const descriptionAr = `${openerAr}، ${purposeAr}، ${amenitiesAr}، بسعر ${priceFmtAr}.`;

  const priceFmtEn = formatSyriaCurrency(input.price, currency, "en");
  const descriptionEn = `${openerEn}: ${purposeEn}; ${amenitiesEn}; listed at ${priceFmtEn}.`;

  let arOut = descriptionAr.trim();
  if (arOut.length < LISTING_MIN_DESCRIPTION_AR_CHARS) {
    arOut += " يمكن متابعة التفاصيل والمعاينة عبر التواصل مع المعلن.";
  }

  return {
    descriptionAr: arOut.slice(0, 4000),
    descriptionEn: descriptionEn.trim().slice(0, 4000),
  };
}
