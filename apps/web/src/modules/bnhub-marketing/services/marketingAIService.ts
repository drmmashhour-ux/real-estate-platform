/**
 * Provider-agnostic AI orchestration: mock + deterministic fallbacks.
 * Plug an LLM by implementing callLLM() later; keep prompts isolated here.
 */
import { VerificationStatus } from "@prisma/client";
import type { BnhubMarketingTone } from "@prisma/client";

export const MARKETING_AI_MOCK = process.env.BNHUB_MARKETING_AI_MOCK !== "0";

export type ListingMarketingInput = {
  title: string;
  city: string;
  region?: string | null;
  country?: string | null;
  description?: string | null;
  propertyType?: string | null;
  roomType?: string | null;
  nightPriceCents: number;
  maxGuests: number;
  beds: number;
  baths: number;
  amenities: unknown;
  verificationStatus: VerificationStatus | string;
  minStayNights?: number | null;
  maxStayNights?: number | null;
  cancellationPolicy?: string | null;
  listingCode?: string | null;
};

export type MarketingAngle =
  | "family_stay"
  | "luxury_stay"
  | "business_traveler"
  | "student_temporary"
  | "romantic_getaway"
  | "long_stay_friendly"
  | "investor_host_promo";

const ANGLE_LABELS: Record<MarketingAngle, { en: string; fr: string }> = {
  family_stay: { en: "Family stay", fr: "Séjour familial" },
  luxury_stay: { en: "Luxury stay", fr: "Séjour de luxe" },
  business_traveler: { en: "Business traveler", fr: "Voyage d’affaires" },
  student_temporary: { en: "Student / temporary housing", fr: "Étudiant / logement temporaire" },
  romantic_getaway: { en: "Romantic getaway", fr: "Escapade romantique" },
  long_stay_friendly: { en: "Long-stay friendly", fr: "Long séjour" },
  investor_host_promo: { en: "Host / investor story", fr: "Promo hôte / investisseur" },
};

function amenityList(a: unknown): string[] {
  if (!Array.isArray(a)) return [];
  return a.filter((x): x is string => typeof x === "string");
}

/** Rule-based angle selection (deterministic). */
export function selectMarketingAngle(input: ListingMarketingInput): MarketingAngle {
  const am = amenityList(input.amenities).map((x) => x.toLowerCase());
  const title = `${input.title} ${input.city}`.toLowerCase();
  const guests = input.maxGuests;

  if (title.includes("luxury") || title.includes("penthouse") || input.nightPriceCents >= 15_000) {
    return "luxury_stay";
  }
  if (
    title.includes("university") ||
    title.includes("hospital") ||
    title.includes("étudiant") ||
    title.includes("student")
  ) {
    return "student_temporary";
  }
  if (guests >= 5 || title.includes("family") || am.some((x) => x.includes("crib") || x.includes("high chair"))) {
    return "family_stay";
  }
  if (
    am.some((x) => x.includes("desk") || x.includes("wifi")) &&
    (title.includes("downtown") || title.includes("metro") || title.includes("centre"))
  ) {
    return "business_traveler";
  }
  if (title.includes("lake") || title.includes("view") || title.includes("chalet") || title.includes("romantic")) {
    return "romantic_getaway";
  }
  if (
    (input.maxStayNights == null || input.maxStayNights >= 28) &&
    (input.minStayNights != null && input.minStayNights <= 7)
  ) {
    return "long_stay_friendly";
  }
  return "business_traveler";
}

export function toneForAngle(angle: MarketingAngle): BnhubMarketingTone {
  if (angle === "luxury_stay" || angle === "romantic_getaway") return "LUXURY";
  if (angle === "investor_host_promo") return "INVESTOR";
  if (angle === "family_stay") return "FRIENDLY";
  return "PROFESSIONAL";
}

function money(cents: number, lang: "en" | "fr"): string {
  const v = (cents / 100).toFixed(0);
  return lang === "fr" ? `${v} $ CAD / nuit` : `$${v} CAD/night`;
}

export type GeneratedAssetDraft = {
  assetType: string;
  languageCode: string;
  tone: BnhubMarketingTone;
  title: string | null;
  content: string;
  metadataJson?: Record<string, unknown>;
};

/** Deterministic multilingual pack from listing + angle. */
export function generateDeterministicAssetPack(
  input: ListingMarketingInput,
  angle: MarketingAngle,
  langs: ("en" | "fr")[] = ["en", "fr"]
): GeneratedAssetDraft[] {
  const tone = toneForAngle(angle);
  const am = amenityList(input.amenities);
  const highlights = am.slice(0, 5).join(", ") || (langs[0] === "fr" ? "Confort & emplacement" : "Comfort & location");
  const verified =
    input.verificationStatus === VerificationStatus.VERIFIED
      ? langs[0] === "fr"
        ? "Vérifié BNHUB"
        : "BNHUB verified"
      : langs[0] === "fr"
        ? "Profil à compléter"
        : "Complete verification for trust badge";

  const drafts: GeneratedAssetDraft[] = [];

  for (const lang of langs) {
    const L = ANGLE_LABELS[angle][lang];
    const city = input.city;
    const title = input.title;
    const price = money(input.nightPriceCents, lang);
    const code = input.listingCode ?? "";

    drafts.push({
      assetType: "HEADLINE",
      languageCode: lang,
      tone,
      title: lang === "fr" ? "Accroche" : "Headline",
      content:
        lang === "fr"
          ? `${title} · ${city} — ${L} (${verified})`
          : `${title} · ${city} — ${L} (${verified})`,
    });
    drafts.push({
      assetType: "CAPTION",
      languageCode: lang,
      tone,
      title: lang === "fr" ? "Légende courte" : "Short caption",
      content:
        lang === "fr"
          ? `${L} à ${city}. ${price}. ${highlights}. Réservez sur BNHUB.`
          : `${L} in ${city}. ${price}. ${highlights}. Book on BNHUB.`,
    });
    drafts.push({
      assetType: "LONG_DESCRIPTION",
      languageCode: lang,
      tone,
      title: null,
      content:
        lang === "fr"
          ? `${title} — ${city}. Angle: ${L}. ${input.maxGuests} invités · ${input.beds} chambres. ${highlights}. Annulation: ${input.cancellationPolicy ?? "standard"}. ${verified}.`
          : `${title} — ${city}. ${L} stay. Sleeps ${input.maxGuests} · ${input.beds} beds. Highlights: ${highlights}. Cancellation: ${input.cancellationPolicy ?? "standard"}. ${verified}.`,
    });
    drafts.push({
      assetType: "SEO_TITLE",
      languageCode: lang,
      tone,
      title: null,
      content:
        lang === "fr"
          ? `${title} | Location courte durée ${city} | BNHUB`
          : `${title} | Short-term rental ${city} | BNHUB`,
    });
    drafts.push({
      assetType: "SEO_META",
      languageCode: lang,
      tone,
      title: null,
      content:
        lang === "fr"
          ? `${L} à ${city}. À partir de ${price}. Réservez un séjour vérifié sur BNHUB.`
          : `${L} in ${city}. From ${price}. Book a verified stay on BNHUB.`,
    });
    drafts.push({
      assetType: "EMAIL_COPY",
      languageCode: lang,
      tone,
      title: null,
      content:
        lang === "fr"
          ? `Objet: Nouveau coup de cœur à ${city}\n\n${title} — ${price}\n${highlights}\nCTA: Voir l’annonce BNHUB${code ? ` (${code})` : ""}`
          : `Subject: New spotlight in ${city}\n\n${title} — ${price}\n${highlights}\nCTA: View on BNHUB${code ? ` (${code})` : ""}`,
    });
    drafts.push({
      assetType: "SOCIAL_POST",
      languageCode: lang,
      tone,
      title: null,
      content:
        lang === "fr"
          ? `✨ ${title} · ${city}\n${L} · ${price}\n#BNHUB #${city.replace(/\s/g, "")}`
          : `✨ ${title} · ${city}\n${L} · ${price}\n#BNHUB #${city.replace(/\s/g, "")}`,
      metadataJson: { variant: "feed_square" },
    });
    drafts.push({
      assetType: "AD_COPY",
      languageCode: lang,
      tone,
      title: null,
      content:
        lang === "fr"
          ? `Réservez ${title} — ${city}. ${price}. Séjour ${verified}.`
          : `Book ${title} — ${city}. ${price}. ${verified} stay.`,
      metadataJson: { placement: "internal_preview", external: "mock_pending" },
    });
    drafts.push({
      assetType: "BROCHURE_TEXT",
      languageCode: lang,
      tone,
      title: null,
      content:
        lang === "fr"
          ? `Brochure — ${title}\n${city} · ${input.propertyType ?? "Logement"}\n${price}\n${input.description?.slice(0, 400) ?? ""}`
          : `Brochure — ${title}\n${city} · ${input.propertyType ?? "Rental"}\n${price}\n${input.description?.slice(0, 400) ?? ""}`,
    });
    drafts.push({
      assetType: "BLOG_FEED_CARD",
      languageCode: lang,
      tone,
      title: lang === "fr" ? `Séjours d’exception à ${city}` : `Top stays in ${city}`,
      content:
        lang === "fr"
          ? `Carte éditoriale: ${title} — angle ${L}. (Aperçu interne BNHUB)`
          : `Editorial card: ${title} — ${L} angle. (Internal BNHUB preview)`,
      metadataJson: { slug: `top-stays-${city.toLowerCase().replace(/\s+/g, "-")}`, internalOnly: true },
    });
  }

  return drafts;
}

export function buildCampaignStrategySummary(
  input: ListingMarketingInput,
  angle: MarketingAngle,
  lang: "en" | "fr" = "en"
): string {
  const L = ANGLE_LABELS[angle][lang];
  if (MARKETING_AI_MOCK) {
    return lang === "fr"
      ? `[Mode déterministe — mock IA] Prioriser ${L} pour ${input.title} (${input.city}). Mettre en avant prix ${money(input.nightPriceCents, "fr")}, confiance ${input.verificationStatus}, et canaux internes BNHUB avant toute diffusion externe (conformité en attente).`
      : `[Deterministic mock — AI slot] Lead with ${L} for ${input.title} (${input.city}). Emphasize ${money(input.nightPriceCents, "en")}, trust ${input.verificationStatus}, and BNHUB internal surfaces before any external channel (compliance pending).`;
  }
  return lang === "fr"
    ? `Stratégie LLM (à brancher): ${L} · ${input.city}`
    : `LLM strategy (to wire): ${L} · ${input.city}`;
}

/** Posting time hints (UTC buckets) — deterministic. */
export function recommendPostingTimes(): { label: string; utcHour: number }[] {
  return [
    { label: "Morning EU/CA", utcHour: 14 },
    { label: "Evening Americas", utcHour: 23 },
    { label: "Weekend browse", utcHour: 16 },
  ];
}
