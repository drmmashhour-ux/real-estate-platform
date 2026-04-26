/**
 * Legal-safe "assisted import": deterministic parsing from user-pasted text only.
 * No third-party scraping; operators confirm all fields before publish.
 */

import { SYRIA_LOCATIONS, type SyriaGovernorate } from "@/data/syriaLocations";
import { validateListingGovernorateCityArea } from "@/lib/syria-location-catalog";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeEasternArabicDigits(s: string): string {
  let out = "";
  for (const ch of s) {
    const i = AR_DIGITS.indexOf(ch);
    out += i >= 0 ? String(i) : ch;
  }
  return out;
}

function collapseWhitespace(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHashtagsAndNoise(s: string): string {
  return s.replace(/#[\w\u0600-\u06FF]+/g, "").replace(/@\w+/g, "").trim();
}

/** Extract https URLs (incl. image URLs user pasted). */
export function extractUrlsFromText(text: string): string[] {
  const re = /https?:\/\/[^\s<>"']+/gi;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  const t = text;
  while ((m = re.exec(t)) !== null) {
    const u = m[0].replace(/[),.]+$/g, "");
    try {
      const parsed = new URL(u);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") set.add(parsed.href);
    } catch {
      /* skip */
    }
  }
  return [...set];
}

export type ListingAssistListingType = "SALE" | "RENT" | "BNHUB";

export function inferListingType(text: string): ListingAssistListingType {
  const t = text.toLowerCase();
  const ar = text;
  if (
    /ليلة|ليالي|ليالي\s|مؤقت|يومي|bnb|bnhub|شقة\s*مفروشة\s*يومي|استئجار\s*يومي/i.test(ar) ||
    /\bper\s*night\b|\bnightly\b|\bshort\s*stay\b/i.test(t)
  ) {
    return "BNHUB";
  }
  if (
    /للإيجار|للايجار|إيجار|ايجار|کرایه|\brent\b|\brental\b|\bfor\s*rent\b/i.test(ar + t)
  ) {
    return "RENT";
  }
  if (/للبيع|بيع|\bfor\s*sale\b|\bsale\b|\bbuy\b/i.test(ar + t)) {
    return "SALE";
  }
  return "SALE";
}

type CityMatch = {
  governorate: SyriaGovernorate;
  cityEn: string;
  cityAr: string;
  score: number;
};

/** Longer city names first to reduce false positives. */
function flatCitiesSorted(): CityMatch[] {
  const rows: CityMatch[] = [];
  for (const g of SYRIA_LOCATIONS) {
    for (const c of g.cities) {
      rows.push({
        governorate: g,
        cityEn: c.name_en,
        cityAr: c.name_ar,
        score: Math.max(c.name_ar.length, c.name_en.length),
      });
    }
  }
  return rows.sort((a, b) => b.score - a.score);
}

export function matchLocationInText(raw: string): {
  governorateEn: string | null;
  cityEn: string | null;
  areaAr: string | null;
  matchedBy: string | null;
} {
  const text = raw;
  const lower = raw.toLowerCase();

  for (const row of flatCitiesSorted()) {
    const hitAr = row.cityAr.length >= 2 && text.includes(row.cityAr);
    const hitEn = row.cityEn.length >= 3 && lower.includes(row.cityEn.toLowerCase());
    if (hitAr || hitEn) {
      const gov = row.governorate.name_en;
      let areaAr: string | null = null;
      const cityObj = row.governorate.cities.find((c) => c.name_en === row.cityEn)!;
      const areas = [...cityObj.areas].sort((a, b) => b.name_ar.length - a.name_ar.length);
      for (const a of areas) {
        if (text.includes(a.name_ar) || lower.includes(a.name_en.toLowerCase())) {
          areaAr = a.name_ar;
          break;
        }
      }
      return {
        governorateEn: gov,
        cityEn: row.cityEn,
        areaAr,
        matchedBy: hitAr ? row.cityAr : row.cityEn,
      };
    }
  }

  for (const g of SYRIA_LOCATIONS) {
    const hitGovAr = text.includes(g.name_ar);
    const hitGovEn = lower.includes(g.name_en.toLowerCase());
    if (hitGovAr || hitGovEn) {
      return {
        governorateEn: g.name_en,
        cityEn: g.cities[0]?.name_en ?? null,
        areaAr: null,
        matchedBy: g.name_ar,
      };
    }
  }

  return { governorateEn: null, cityEn: null, areaAr: null, matchedBy: null };
}

/**
 * Parse a human-entered price into a decimal string suitable for `SyriaProperty.price`.
 * Heuristics for مليون / ألف; not financial advice.
 */
export function extractPriceString(text: string): string | null {
  const normalized = normalizeEasternArabicDigits(text).replace(/,/g, "").replace(/٬/g, "");
  const candidates: number[] = [];

  let mm: RegExpExecArray | null;
  const millionRe = /(\d+(?:\.\d+)?)\s*(مليون|million)/gi;
  while ((mm = millionRe.exec(normalized)) !== null) {
    const base = Number.parseFloat(mm[1] ?? "");
    if (Number.isFinite(base)) candidates.push(base * 1_000_000);
  }

  const thousandRe = /(\d+(?:\.\d+)?)\s*(ألف|الف|alf|thousand)/gi;
  while ((mm = thousandRe.exec(normalized)) !== null) {
    const base = Number.parseFloat(mm[1] ?? "");
    if (Number.isFinite(base)) candidates.push(base * 1_000);
  }

  const plainRe = /\b(\d{5,}(?:\.\d+)?)\b/g;
  while ((mm = plainRe.exec(normalized)) !== null) {
    const base = Number.parseFloat(mm[1] ?? "");
    if (Number.isFinite(base)) candidates.push(base);
  }

  const smallPlain = /\b(\d{1,4}(?:\.\d+)?)\b/g;
  while ((mm = smallPlain.exec(normalized)) !== null) {
    const base = Number.parseFloat(mm[1] ?? "");
    if (Number.isFinite(base) && base >= 1000) candidates.push(base);
  }

  if (candidates.length === 0) return null;
  const max = Math.max(...candidates);
  if (!Number.isFinite(max) || max <= 0) return null;
  return max.toFixed(0);
}

export type ListingAssistResult = {
  titleArSuggestion: string;
  descriptionCleanAr: string;
  titleEnSuggestion: string | null;
  price: string | null;
  listingType: ListingAssistListingType;
  governorateEn: string | null;
  cityEn: string | null;
  areaAr: string | null;
  /** URLs suitable for `images` field (one per line in form). */
  imageUrls: string[];
  locationValid: boolean;
  confidenceNotes: string[];
  facebookUrlNote: string | null;
};

export function parseListingAssistInput(input: {
  rawText: string;
  extraImageLines?: string;
  facebookUrl?: string | null;
}): ListingAssistResult {
  const notes: string[] = [];
  const raw = collapseWhitespace(stripHashtagsAndNoise(input.rawText));
  if (!raw) {
    return {
      titleArSuggestion: "",
      descriptionCleanAr: "",
      titleEnSuggestion: null,
      price: null,
      listingType: "SALE",
      governorateEn: null,
      cityEn: null,
      areaAr: null,
      imageUrls: [],
      locationValid: false,
      confidenceNotes: ["Empty paste — add property description."],
      facebookUrlNote: null,
    };
  }

  const listingType = inferListingType(raw);
  const loc = matchLocationInText(raw);
  if (loc.governorateEn && loc.cityEn) {
    const v = validateListingGovernorateCityArea(loc.governorateEn, loc.cityEn, loc.areaAr, null);
    if (!v.ok) notes.push("Location guess failed catalog validation — pick manually on the sell form.");
  }

  const price = extractPriceString(raw);
  if (!price) notes.push("No clear price detected — enter manually.");

  const urlFromBody = extractUrlsFromText(raw).filter((u) => !/facebook\.com/i.test(u));
  const fromExtra = (input.extraImageLines ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const imageUrls = [...new Set([...urlFromBody, ...fromExtra])].slice(0, 24);

  const firstLine = raw.split("\n").map((l) => l.trim()).find(Boolean) ?? raw.slice(0, 80);
  const cityAr =
    loc.cityEn && SYRIA_LOCATIONS.flatMap((g) => g.cities).find((c) => c.name_en === loc.cityEn)?.name_ar;
  const typeWord =
    listingType === "RENT" ? "إيجار" : listingType === "BNHUB" ? "إقامة قصيرة" : "بيع";
  const titleArSuggestion =
    [firstLine.slice(0, 52), cityAr ? `· ${cityAr}` : "", price ? `· ${price}` : ""].filter(Boolean).join(" ").slice(0, 120);

  const descriptionCleanAr = collapseWhitespace(raw).slice(0, 12000);

  let facebookUrlNote: string | null = null;
  const fb = input.facebookUrl?.trim();
  if (fb) {
    try {
      const u = new URL(fb);
      if (/facebook\.com$/i.test(u.hostname) || u.hostname.endsWith(".facebook.com")) {
        facebookUrlNote =
          "Automated scraping of Facebook is not used. Copy visible text and photos from the post into the fields above, then confirm.";
      }
    } catch {
      facebookUrlNote = "Facebook link invalid — paste text manually.";
    }
  }

  const locationValid =
    !!(loc.governorateEn && loc.cityEn) &&
    validateListingGovernorateCityArea(loc.governorateEn, loc.cityEn, loc.areaAr, null).ok;

  if (loc.matchedBy) notes.push(`Matched location keyword: «${loc.matchedBy}».`);
  else notes.push("No governorate/city detected — select location on the sell form.");

  return {
    titleArSuggestion: titleArSuggestion || descriptionCleanAr.slice(0, 80),
    descriptionCleanAr,
    titleEnSuggestion: null,
    price,
    listingType,
    governorateEn: loc.governorateEn,
    cityEn: loc.cityEn,
    areaAr: loc.areaAr,
    imageUrls,
    locationValid,
    confidenceNotes: notes,
    facebookUrlNote,
  };
}
