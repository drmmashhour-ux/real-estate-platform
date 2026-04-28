/**
 * SYBNB-18 — Lightweight automation presets for operators (titles, price hints, WhatsApp snippets).
 * Numbers are **heuristic anchors** only — adjust via code review as market moves.
 */

/** Appended to duplicated listing titles (Arabic-first market). */
export const SYBNB_LISTING_DUPLICATE_TITLE_SUFFIX_AR = " · نسخة";

/** English duplicate suffix when `titleEn` exists. */
export const SYBNB_LISTING_DUPLICATE_TITLE_SUFFIX_EN = " (copy)";

/** Rough nightly SYP bands for placeholder hints — keyed by normalized English city name. */
const NIGHTLY_SYP_HINT_BY_CITY: Record<string, { min: number; max: number }> = {
  damascus: { min: 200_000, max: 550_000 },
  latakia: { min: 160_000, max: 480_000 },
  aleppo: { min: 140_000, max: 420_000 },
  homs: { min: 120_000, max: 380_000 },
};

const DEFAULT_NIGHTLY_HINT = { min: 120_000, max: 450_000 };

export function sybnbNightlySypHintRangeForCity(cityRaw: string): { min: number; max: number } {
  const k = cityRaw.trim().toLowerCase().replace(/\s+/g, "_");
  const plain = cityRaw.trim().toLowerCase();
  const hit =
    NIGHTLY_SYP_HINT_BY_CITY[k] ??
    NIGHTLY_SYP_HINT_BY_CITY[plain] ??
    (plain.includes("damascus") || plain.includes("دمشق") ? NIGHTLY_SYP_HINT_BY_CITY.damascus : null) ??
    (plain.includes("latakia") || plain.includes("اللاذقية") ? NIGHTLY_SYP_HINT_BY_CITY.latakia : null);
  return hit ?? DEFAULT_NIGHTLY_HINT;
}

/** Title pattern suggestion — operators replace brackets. */
export const SYBNB_TITLE_STRUCTURE_HINT_AR =
  "إقامة [غرفة/شقة] في [المنطقة أو الحي] — [المدينة]";

export const SYBNB_TITLE_STRUCTURE_HINT_EN =
  "[Studio / apartment] in [area] — [city]";

/** WhatsApp — paste as-is; tune tone per channel (SYBNB-17/18). */
export const SYBNB_WHATSAPP_AUTOMATION_AR = {
  intro:
    "مرحبا 👋 نطلق منصة إقامات قصيرة في سوريا. إذا عندك غرفة أو شقة للإيجار اليومي، منقدر ننشر الإعلان مجاناً حالياً.",
  followUp:
    "تمام 🙏 أرسلني صوراً واضحة، المدينة والحي، والسعر التقريبي لليلة، وبجهّز مسودة الإعلان بسرعة.",
  closing:
    "إذا جاهز للنشر، بأكّد العنوان والسعر وببعتلك رابط الإعلان للمراجعة قبل الظهور النهائي 👍",
} as const;
