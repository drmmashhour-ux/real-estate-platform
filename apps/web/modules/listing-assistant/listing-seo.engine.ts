import type { SeoPack } from "@/modules/listing-assistant/listing-assistant.types";

function clampTitle(s: string, max = 60): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function clampMeta(s: string, max = 158): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Deterministic SEO hints — brokers still validate before publishing.
 */
export function buildSeoPack(input: {
  title: string;
  description: string;
  city?: string;
  listingType?: string;
  language?: string;
}): SeoPack {
  const city = input.city?.trim() || "";
  const type = (input.listingType ?? "HOME").replace(/_/g, " ").toLowerCase();
  const baseKeywords = [
    city && `${city} real estate`,
    city && `${city} ${type}`,
    `${type} for sale`,
    city && `${city} property`,
    "listing",
    input.language === "fr" ? "immobilier" : input.language === "ar" ? "عقار" : null,
  ].filter(Boolean) as string[];

  const keywords = [...new Set(baseKeywords)].slice(0, 12);

  const googleTitle = clampTitle(input.title || `${city || "Property"} · ${type}`);

  const firstLine =
    input.description.split("\n").find((l) => l.trim().length > 40) ?? input.description;
  const metaDescription = clampMeta(
    firstLine.length > 80 ? firstLine : `${googleTitle}. ${input.description.slice(0, 120)}`,
  );

  return {
    keywords,
    metaDescription,
    googleTitle,
  };
}
