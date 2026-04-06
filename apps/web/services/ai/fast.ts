/**
 * Fast, deterministic listing wizard helpers (+ optional OpenAI when configured).
 */

import { prisma } from "@/lib/db";

export function generateTitle(city: string): string {
  const c = city.trim() || "your city";
  return `Bright stay in ${c}`;
}

export type ListingWizardAiContext = {
  city: string;
  title?: string;
  pricePerNight?: number;
  amenities?: string[];
};

export function generateDescription(data: ListingWizardAiContext): string {
  const city = data.city.trim() || "the area";
  const title = (data.title ?? "").trim() || `Your stay in ${city}`;
  const price =
    data.pricePerNight != null && Number.isFinite(data.pricePerNight)
      ? ` Around $${Math.round(data.pricePerNight)} CAD per night.`
      : "";
  const amenityLine =
    data.amenities && data.amenities.length
      ? ` Highlights: ${data.amenities.slice(0, 8).join(", ")}.`
      : "";
  return `${title} — welcoming short-term stay in ${city}.${price}${amenityLine} Quiet hours after 10 p.m. No parties. Contact the host for special requests.`;
}

export async function suggestPrice(city: string): Promise<number> {
  const raw = city.trim();
  if (!raw) return 149;

  const agg = await prisma.shortTermListing.aggregate({
    where: {
      city: { contains: raw, mode: "insensitive" },
      listingStatus: "PUBLISHED",
    },
    _avg: { nightPriceCents: true },
    _count: true,
  });

  const avgCents = agg._avg.nightPriceCents;
  if (avgCents != null && Number.isFinite(avgCents) && agg._count > 0) {
    return Math.max(49, Math.round(avgCents / 100));
  }

  const fallback: Record<string, number> = {
    montreal: 165,
    montréal: 165,
    quebec: 139,
    québec: 139,
    laval: 125,
    gatineau: 118,
    sherbrooke: 99,
    trois: 95,
  };
  const key = raw.toLowerCase().replace(/\s+/g, " ");
  for (const [k, v] of Object.entries(fallback)) {
    if (key.includes(k)) return v;
  }
  return 139;
}

const DEFAULT_AMENITIES = [
  "WiFi",
  "Kitchen",
  "Air conditioning",
  "Heating",
  "Hot water",
  "Smoke alarm",
  "Essentials",
  "Hangers",
];

export function suggestAmenities(): string[] {
  return [...DEFAULT_AMENITIES];
}
