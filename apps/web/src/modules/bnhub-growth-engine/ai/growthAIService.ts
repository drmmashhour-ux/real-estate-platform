/**
 * Provider-agnostic growth AI: mock + deterministic fallbacks; plug LLM later.
 */
import type {
  BnhubGrowthAutonomyLevel,
  BnhubGrowthCampaignObjective,
  BnhubGrowthCampaignType,
} from "@prisma/client";

export const GROWTH_AI_MOCK = process.env.BNHUB_GROWTH_AI_MOCK !== "0";

export type ListingGrowthInput = {
  title: string;
  city: string;
  country: string;
  description: string | null;
  nightPriceCents: number;
  maxGuests: number;
  amenities: unknown;
  listingCode: string;
};

export function pickPrimaryAngle(input: ListingGrowthInput): string {
  const t = `${input.title} ${input.city}`.toLowerCase();
  if (t.includes("luxury") || input.nightPriceCents >= 150_00) return "luxury_stay";
  if (input.maxGuests >= 5 || t.includes("family")) return "family_stay";
  if (t.includes("metro") || t.includes("business") || t.includes("downtown")) return "business_traveler";
  if (t.includes("lake") || t.includes("view") || t.includes("chalet")) return "romantic_getaway";
  return "short_break";
}

export function suggestBudgetTierCents(nightPriceCents: number): { daily: number; total: number } {
  const daily = Math.min(50_000, Math.max(5_000, Math.round(nightPriceCents * 0.15)));
  const total = daily * 14;
  return { daily, total };
}

export function suggestChannels(): { internal: string[]; externalPending: string[] } {
  return {
    internal: ["internal_homepage", "internal_search_boost", "internal_email"],
    externalPending: ["meta_ads", "google_ads", "tiktok_ads", "whatsapp_business"],
  };
}

export function buildLaunchStrategySummary(
  input: ListingGrowthInput,
  type: BnhubGrowthCampaignType,
  objective: BnhubGrowthCampaignObjective,
  autonomy: BnhubGrowthAutonomyLevel,
  lang: "en" | "fr"
): string {
  const angle = pickPrimaryAngle(input);
  const { daily, total } = suggestBudgetTierCents(input.nightPriceCents);
  const ch = suggestChannels();
  if (lang === "fr") {
    return (
      `Stratégie (${type}, ${objective}, autonomie ${autonomy}): angle « ${angle} » pour ${input.title} à ${input.city}. ` +
      `Budget indicatif: ${(daily / 100).toFixed(0)} $/jour, total suggéré ~${(total / 100).toFixed(0)} $. ` +
      `Canaux internes: ${ch.internal.join(", ")}. ` +
      `Canaux externes: architecture prête (${ch.externalPending.join(", ")}) — intégration réelle soumise à vérification entreprise et conformité.`
    );
  }
  return (
    `Strategy (${type}, ${objective}, autonomy ${autonomy}): lead with "${angle}" for ${input.title} in ${input.city}. ` +
    `Suggested budget tier: ~$${(daily / 100).toFixed(0)}/day, ~$${(total / 100).toFixed(0)} total (AI estimate, not a guarantee). ` +
    `Internal: ${ch.internal.join(", ")}. ` +
    `External: connectors scaffolded (${ch.externalPending.join(", ")}) — real delivery requires verified ad accounts and policy approval; until then adapters return setup_required.`
  );
}

export function generateAssetPack(
  input: ListingGrowthInput,
  langs: ("en" | "fr")[]
): {
  family: string;
  lang: string;
  title: string | null;
  content: string;
  ctaText: string | null;
  platformHint: string | null;
}[] {
  const angle = pickPrimaryAngle(input);
  const out: ReturnType<typeof generateAssetPack> = [];
  for (const lang of langs) {
    const isFr = lang === "fr";
    const city = input.city;
    const price = (input.nightPriceCents / 100).toFixed(0);
    out.push({
      family: "HEADLINE",
      lang,
      title: isFr ? "Titre" : "Headline",
      content: isFr
        ? `${input.title} — ${angle.replace(/_/g, " ")} à ${city} · dès ${price}$ / nuit`
        : `${input.title} — ${angle.replace(/_/g, " ")} in ${city} · from $${price}/night`,
      ctaText: isFr ? "Réserver sur BNHub" : "Book on BNHub",
      platformHint: "bnhub",
    });
    out.push({
      family: "LANDING_COPY",
      lang,
      title: isFr ? "Accroche" : "Hero copy",
      content: isFr
        ? `${input.title}. ${(input.description ?? "").slice(0, 400)}`
        : `${input.title}. ${(input.description ?? "").slice(0, 400)}`,
      ctaText: isFr ? "Voir les disponibilités" : "Check availability",
      platformHint: "landing",
    });
    out.push({
      family: "WHATSAPP_COPY",
      lang,
      title: null,
      content: isFr
        ? `Bonjour! ${input.title} à ${city} — ${price}$/nuit. Infos: BNHub ${input.listingCode}`
        : `Hi! ${input.title} in ${city} — $${price}/night. More info on BNHub ${input.listingCode}`,
      ctaText: null,
      platformHint: "whatsapp_template_pending",
    });
  }
  return out;
}
