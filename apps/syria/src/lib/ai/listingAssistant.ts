import { isSyriaAmenityKey, normalizeSyriaAmenityKeys, SYRIA_AMENITIES } from "@/lib/syria/amenities";
import { onlyDigits } from "@/lib/syria-phone";

export type ListingAssistantInput = {
  title: string;
  description: string;
  city: string;
  state: string;
  price: string | number;
  amenities: string[];
  phone?: string;
  /** For quick-post / edit flows */
  imageCount?: number;
  area?: string;
  addressDetails?: string;
};

export type ListingAssistantResult = {
  improvedTitle: string;
  improvedDescription: string;
  /** Only catalog keys; never invent unknown keys. */
  suggestedAmenities: string[];
  /** Price is suggestions only; no automated repricing. */
  priceWording: string;
  qualityScore: number;
  tips: string[];
};

const PLACEHOLDER_DESC = "—";

function clampTitle(s: string, max = 200): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function improveTitle(
  input: ListingAssistantInput,
  locale: "ar" | "en",
): { value: string; tips: string[] } {
  const raw = input.title.trim();
  const city = input.city.trim();
  const st = input.state.trim();
  const tips: string[] = [];
  if (raw.length < 4) {
    tips.push(
      locale === "ar" ? "أضف العنوان والمدينة ونوع العقار (مثال: شقة — دمشق، المزة)." : "Add title, city, and property type (e.g. apartment — Damascus, Mazzeh).",
    );
  }
  let next = raw;
  if (city && !next.toLowerCase().includes(city.toLowerCase())) {
    next = next.length > 0 ? `${next} · ${city}` : city;
    tips.push(locale === "ar" ? "يُفضّل ذكر المدينة في العنوان." : "Including the city in the title helps buyers.");
  } else if (st && !city) {
    tips.push(locale === "ar" ? "اذكر المدينة إن كان ذلك ممكناً." : "Mention the city when possible.");
  }
  return { value: clampTitle(next), tips };
}

function improveDescription(
  input: ListingAssistantInput,
  locale: "ar" | "en",
): { value: string; tips: string[] } {
  const d = input.description.trim();
  const city = input.city.trim();
  const st = input.state.trim();
  const area = (input.area ?? "").trim();
  const tips: string[] = [];

  if (!d || d === PLACEHOLDER_DESC || d.length < 8) {
    if (locale === "ar") {
      const loc = [city, st].filter(Boolean).join(" — ");
      return {
        value: loc
          ? `عقار في ${loc}${area ? `، ${area}` : ""}. يرجى التواصل عبر الواتساب لمعرفة التفاصيل والمعاينة.`
          : "صف العقار باختصار: المساحة التقريبية، الطابق، الكهرباء والمياه، والموقع بالنسبة للشوارع الرئيسية.",
        tips: [
          "زِد وصفاً قصيراً يساعد المهتم: مساحة، طابق، خدمات قريبة.",
        ],
      };
    }
    return {
      value: city
        ? `Property in ${city}${st ? `, ${st}` : ""}. Contact via WhatsApp for details and viewings.`
        : "Add a short description: approximate size, floor, utilities, and how to reach the place.",
      tips: ["A clearer description (size, floor, nearby services) increases replies."],
    };
  }

  if (d.length < 40) {
    tips.push(
      locale === "ar" ? "يمكنك إضافة تفاصيل عن المساحة والبناء والخدمات." : "Add details about size, building age, and utilities.",
    );
  }
  return { value: d, tips };
}

/** Keyword → catalog amenity; only existing keys. */
function inferAmenitiesFromText(text: string, already: Set<string>): string[] {
  const t = text.toLowerCase();
  const out: string[] = [];
  const add = (key: (typeof SYRIA_AMENITIES)[number]["key"]) => {
    if (!already.has(key) && !out.includes(key)) out.push(key);
  };
  if (/مكي|مكا|air.?condition|a\.?c\.?\b|تكييف/.test(t)) add("air_conditioning");
  if (/كهرب|24\s*ساع|electricity|power/.test(t)) add("electricity_24h");
  if (/مياه|ساخن|water|hot/.test(t)) add("hot_water_24h");
  if (/مفروش|furnish/.test(t)) add("furnished");
  if (/wifi|واي|واي فاي|wi-?fi/.test(t)) add("wifi");
  if (/سوق|market/.test(t)) add("near_market");
  if (/وسط|center|downtown|city center|وسط المدينة/.test(t)) add("city_center");
  return out.slice(0, 4);
}

function priceWordingHint(input: ListingAssistantInput, locale: "ar" | "en"): string {
  const n = typeof input.price === "number" ? input.price : Number(String(input.price).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) {
    return locale === "ar" ? "تأكد من كتابة السعر بشكل واضح (بالليرة السورية)." : "State the price clearly in SYP when possible.";
  }
  if (n >= 1_000_000 && n % 1_000_000 === 0) {
    return locale === "ar" ? "يمكنك كتابة السعر بصيغة مليون لسهولة القراءة." : "Round millions can be easier to read (e.g. 25M SYP).";
  }
  return locale === "ar" ? "اذكر إن كان السعر قابل للتفاوض إذا يناسبك." : "Mention if the price is negotiable when relevant.";
}

export function computeQualityScore(i: ListingAssistantInput & { phone?: string }): number {
  let s = 0;
  if (i.title.trim().length >= 5) s += 10;
  if (i.title.trim().length >= 20) s += 10;
  const price = typeof i.price === "number" ? i.price : Number(String(i.price).replace(/[^\d.]/g, ""));
  if (Number.isFinite(price) && price > 0) s += 15;
  const ph = i.phone ? onlyDigits(i.phone) : "";
  if (ph.length >= 8) s += 15;
  if ((i.imageCount ?? 0) >= 3) s += 20;
  const am = Array.isArray(i.amenities) ? normalizeSyriaAmenityKeys(i.amenities) : [];
  if (am.length >= 2) s += 15;
  if (i.state.trim() && i.city.trim()) s += 5;
  const details = (i.addressDetails ?? "").trim() + (i.area ?? "").trim();
  if (details.length >= 3) s += 10;
  if (i.description.trim() && i.description.trim() !== PLACEHOLDER_DESC && i.description.trim().length >= 40) s += 10;
  return Math.min(100, s);
}

/**
 * Deterministic, Syria-market–friendly listing helper. Suggests only; user must apply changes.
 */
export function runListingAssistant(
  input: ListingAssistantInput,
  locale: string = "ar",
): ListingAssistantResult {
  const loc: "ar" | "en" = locale.startsWith("en") ? "en" : "ar";
  const tTitle = improveTitle(input, loc);
  const tDesc = improveDescription(input, loc);
  const have = new Set(
    (input.amenities ?? []).filter((x): x is string => typeof x === "string" && isSyriaAmenityKey(x)),
  );
  const blob = [input.title, input.description, input.area, input.addressDetails].filter(Boolean).join(" ");
  const suggestedAmenities = inferAmenitiesFromText(blob, have);
  const priceWording = priceWordingHint(input, loc);
  const qualityScore = computeQualityScore(input);
  const tips = [...tTitle.tips, ...tDesc.tips, priceWording].filter(
    (x, i, a) => a.indexOf(x) === i,
  );
  if (suggestedAmenities.length) {
    tips.push(
      loc === "ar" ? "راجع اقتراحات المميزات — أضف فقط ما ينطبق فعلياً." : "Review suggested features — add only what truly applies.",
    );
  }

  return {
    improvedTitle: tTitle.value,
    improvedDescription: tDesc.value,
    suggestedAmenities,
    priceWording,
    qualityScore,
    tips,
  };
}
