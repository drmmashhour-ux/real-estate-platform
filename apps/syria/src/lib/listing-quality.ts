/**
 * Listing quality heuristics — suggestions only; no automatic publish or hidden rewrites.
 * Optional AI enrichment can plug in later behind the same surface.
 */

import type { SyriaProperty } from "@/generated/prisma";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import { normalizeSyriaAmenityKeys } from "@/lib/syria/amenities";

export type ListingQualityIssueCode =
  | "title_short"
  | "title_weak"
  | "description_short"
  | "description_weak"
  | "photos_low"
  | "amenities_sparse"
  | "amenities_empty"
  | "amenities_missing_basics"
  | "english_missing";

export type ListingQualityResult = {
  score: number;
  issues: { code: ListingQualityIssueCode; messageAr: string; messageEn: string }[];
  /** Short tips shown in dashboard / sell flow */
  tipsAr: string[];
  tipsEn: string[];
  suggestedTitleEn?: string;
  suggestedTitleAr?: string;
};

const MIN_TITLE_LEN = 8;
/** ORDER SYBNB-68 — same threshold for smart-description generation triggers */
export const LISTING_MIN_DESCRIPTION_AR_CHARS = 80;
const MIN_PHOTOS = 2;
const MIN_AMENITIES = 2;

function weakWords(title: string): boolean {
  const t = title.toLowerCase();
  return /^(for sale|property|listing|شقة|منزل)\s*$/u.test(t.trim()) || t.trim().length < MIN_TITLE_LEN;
}

export function analyzeListingQuality(property: Pick<
  SyriaProperty,
  "titleAr" | "titleEn" | "descriptionAr" | "descriptionEn" | "images" | "amenities" | "city"
>): ListingQualityResult {
  const issues: ListingQualityResult["issues"] = [];
  const tipsAr: string[] = [];
  const tipsEn: string[] = [];

  const images = Array.isArray(property.images)
    ? (property.images as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const amenities = Array.isArray(property.amenities)
    ? (property.amenities as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const amenitiesNormalized = normalizeSyriaAmenityKeys(amenities);

  let score = 100;

  if (property.titleAr.trim().length < MIN_TITLE_LEN || weakWords(property.titleAr)) {
    score -= 15;
    issues.push({
      code: "title_weak",
      messageAr: "العنوان قصير جداً أو عام — أضف المدينة ونوع العقار والتميز.",
      messageEn: "Title is too short or generic — add city, property type, and a clear hook.",
    });
    tipsAr.push("اجعل العنوان يوضح المدينة والنوع (مثال: شقة مفروشة — دمشق، المزة).");
    tipsEn.push("Make the title specific: city + property type + one differentiator.");
  }

  if (!property.titleEn?.trim()) {
    score -= 5;
    issues.push({
      code: "english_missing",
      messageAr: "إضافة عنوان بالإنجليزية تساعد الزوار الذين يفضلون English.",
      messageEn: "Adding an English title helps visitors browsing in English.",
    });
  }

  if (property.descriptionAr.trim().length < LISTING_MIN_DESCRIPTION_AR_CHARS) {
    score -= 20;
    issues.push({
      code: "description_short",
      messageAr: "الوصف العربي قصير — أضف التفاصيل العملية (المساحة، الطابق، الخدمات القريبة).",
      messageEn: "Arabic description is short — add practical details (size, floor, nearby services).",
    });
    tipsAr.push("صف حالة البناء، الطابق، الإطلالة، والمواصلات القريبة إن وجدت.");
    tipsEn.push("Describe layout, floor, condition, parking, and nearby amenities.");
  }

  if (images.length < MIN_PHOTOS) {
    score -= 18;
    issues.push({
      code: "photos_low",
      messageAr: `عدد الصور منخفض (${images.length}). يُفضّل ${MIN_PHOTOS}+ صور واضحة.`,
      messageEn: `Low photo count (${images.length}). Aim for at least ${MIN_PHOTOS} clear photos.`,
    });
    tipsAr.push("أضف صوراً للواجهة، الصالون، المطبخ، والحمام على الأقل.");
    tipsEn.push("Include facade, living area, kitchen, and bathroom shots at minimum.");
  }

  if (amenities.length === 0) {
    score -= 14;
    issues.push({
      code: "amenities_empty",
      messageAr: "لا توجد مرافق مذكورة — أضف كهرباء، واي فاي، ماء ساخن، أو مفروش لرفع الثقة.",
      messageEn: "No amenities listed — add electricity, Wi‑Fi, hot water, or furnished to improve trust.",
    });
  } else {
    if (amenitiesNormalized.length === 0) {
      score -= 10;
      issues.push({
        code: "amenities_sparse",
        messageAr: "لم نتعرّف على مفاتيح المرافق — استخدم الخيارات المعتمدة (كهرباء، واي فاي…).",
        messageEn: "Amenities aren’t using catalog keys — pick standard tags (electricity, Wi‑Fi…).",
      });
    } else if (amenitiesNormalized.length < MIN_AMENITIES) {
      score -= 12;
      issues.push({
        code: "amenities_sparse",
        messageAr: "لوحة المرافق شبه فارغة — أضف كهرباء، واي فاي، ماء، مكيف…",
        messageEn: "Amenities list is sparse — add electricity, Wi‑Fi, hot water, AC…",
      });
    }
    const hasBasics =
      amenitiesNormalized.includes("electricity_24h") ||
      amenitiesNormalized.includes("wifi") ||
      amenitiesNormalized.includes("water") ||
      amenitiesNormalized.includes("hot_water_24h");
    if (amenitiesNormalized.length > 0 && !hasBasics) {
      score -= 8;
      issues.push({
        code: "amenities_missing_basics",
        messageAr: "لا توجد إشارة إلى كهرباء / واي فاي / ماء ساخن — الإعلانات التي تعرضها تُثقَل أكثر.",
        messageEn: "Missing basics (electricity / Wi‑Fi / hot water) — listings with these signals convert better.",
      });
    }
  }

  score = Math.max(0, Math.min(100, score));

  const threshold = syriaPlatformConfig.autonomy.listingQualityAssistThreshold;
  if (score < threshold) {
    tipsAr.push(`درجة الجودة الحالية ${score}/100 — راجع النقاط أعلاه قبل النشر.`);
    tipsEn.push(`Current quality score ${score}/100 — review the points above before publishing.`);
  }

  const suggestedTitleAr =
    property.titleAr.trim().length < MIN_TITLE_LEN
      ? `شقة في ${property.city} — تحديث العنوان ليوضح المساحة أو الحي`
      : undefined;
  const suggestedTitleEn =
    property.titleEn?.trim()
      ? undefined
      : `Apartment in ${property.city} — add specifics (rooms, neighborhood)`;

  return {
    score,
    issues,
    tipsAr: [...new Set(tipsAr)],
    tipsEn: [...new Set(tipsEn)],
    suggestedTitleAr,
    suggestedTitleEn,
  };
}
