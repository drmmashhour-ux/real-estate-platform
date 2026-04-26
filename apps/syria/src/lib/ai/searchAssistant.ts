import { parseFeaturesQuery } from "@/lib/syria/amenities";
import { SYRIA_STATE_OPTIONS } from "@/lib/syria/states";

/**
 * Inferred search filters for browse query strings.
 * Best-effort; no external APIs.
 */
export type SearchAssistantFilters = {
  q?: string;
  state?: string;
  governorate?: string;
  city?: string;
  features?: string;
  sort?: string;
  typeHint?: "SALE" | "RENT";
};

export type SearchAssistantResult = {
  filters: SearchAssistantFilters;
  explanation: string;
};

const STATE_ALIASES: { re: RegExp; state: string }[] = [
  { re: /دمشق|دِمشق|damascus|dimashq|damas/i, state: "Damascus" },
  { re: /حلب|haleb|aleppo|halab/i, state: "Aleppo" },
  { re: /حمص|homs|hims/i, state: "Homs" },
  { re: /اللاذقية|لاذقية|latakia|lattakia/i, state: "Latakia" },
  { re: /حماة|حما|hama/i, state: "Hama" },
  { re: /طرطوس|tartus|tartous/i, state: "Tartus" },
  { re: /إدلب|ادلب|idlib/i, state: "Idlib" },
  { re: /درعا|daraa|dara/i, state: "Daraa" },
  { re: /ريف دمشق|rif dimashq|rif|damascus countryside/i, state: "Rif Dimashq" },
  { re: /دير|deir|deirezor|ezzor|الزور/i, state: "Deir ez-Zor" },
  { re: /رقة|raqqa|rakka/i, state: "Raqqa" },
  { re: /الحسكة|حسكة|hasakah|al-?hasakah/i, state: "Al-Hasakah" },
  { re: /السويداء|suwayda|as-?suwayda/i, state: "As-Suwayda" },
  { re: /القنيطرة|quneitra|golan/i, state: "Quneitra" },
];

function isValidState(s: string): boolean {
  return SYRIA_STATE_OPTIONS.some((o) => o.value === s);
}

/**
 * Map free text (e.g. "بيت دمشق كهرباء") to filters.
 */
export function inferSearchFromQuery(
  query: string,
  options?: { defaultLocale?: string },
): SearchAssistantResult {
  const loc = options?.defaultLocale?.startsWith("en") ? "en" : "ar";
  const q = query.trim();
  if (!q) {
    return {
      filters: {},
      explanation: loc === "ar" ? "أدخل كلمات للبحث." : "Enter search words.",
    };
  }

  const featureKeys: string[] = [];
  if (/كهرب|24\s*ساع|كهرباء|electricity|power/i.test(q)) {
    featureKeys.push("electricity_24h");
  }
  if (/مكي|مكا|تكييف|air|a\.?c\.?\b|conditioning/i.test(q)) {
    featureKeys.push("air_conditioning");
  }
  if (/مفروش|furnish/i.test(q)) {
    featureKeys.push("furnished");
  }
  if (/wifi|واي|واي فاي|wi-?fi/i.test(q)) {
    featureKeys.push("wifi");
  }

  let state: string | undefined;
  for (const row of STATE_ALIASES) {
    if (row.re.test(q)) {
      state = row.state;
      break;
    }
  }
  if (state && !isValidState(state)) state = undefined;

  let typeHint: "SALE" | "RENT" | undefined;
  if (/إيجار|ايجار|للإيجار|للايجار|rent|rental|tenant|إيجار/i.test(q)) {
    typeHint = "RENT";
  } else if (/للبيع|البيع|للشراء|sale|for sale|purchase|buy(?!\s+now)/i.test(q)) {
    typeHint = "SALE";
  }

  let qText = q;
  if (state) {
    const row = STATE_ALIASES.find((r) => r.state === state);
    if (row) qText = qText.replace(row.re, " ");
  }
  qText = qText
    .replace(/كهرباء|24\s*ساع|كهرب|مكي|مكا|مفروش|تكييف|واي|واي فاي|wifi|إيجار|ايجار|للإيجار|للبيع|بيع|بيع|rent|sale/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const filters: SearchAssistantFilters = {};
  if (state) filters.state = state;
  if (featureKeys.length) {
    const normalized = parseFeaturesQuery(featureKeys.join(","));
    if (normalized.length) filters.features = normalized.join(",");
  }
  if (qText) filters.q = qText;
  if (typeHint) filters.typeHint = typeHint;

  const exParts: string[] = [];
  if (state) {
    exParts.push(loc === "ar" ? `المحافظة: ${state}` : `State: ${state}`);
  }
  if (featureKeys.length) {
    exParts.push(loc === "ar" ? `مميزات: ${featureKeys.join(", ")}` : `Features: ${featureKeys.join(", ")}`);
  }
  if (typeHint) {
    exParts.push(
      typeHint === "RENT" ? (loc === "ar" ? "نوع: إيجار" : "Type: rent") : loc === "ar" ? "نوع: بيع" : "Type: sale",
    );
  }
  if (qText) {
    exParts.push(loc === "ar" ? `نص إضافي: ${qText}` : `Keywords: ${qText}`);
  }

  return {
    filters,
    explanation:
      exParts.length > 0
        ? (loc === "ar" ? "استنتاج: " : "Inferred: ") + exParts.join(" — ")
        : loc === "ar"
          ? "لم نستنتج فلاتر واضحة — سيتم البحث بالنص."
          : "No strong filters inferred — search will use the full text.",
  };
}
