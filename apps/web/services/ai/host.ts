import { prisma } from "@/lib/db";

export type HostListingDescriptionInput = {
  title: string;
  city: string;
  propertyType?: string;
  maxGuests?: number;
  bedrooms?: number;
  amenities?: string[];
};

/**
 * Short, guest-friendly marketing copy (no markdown, no JSON).
 */
export function generateSimpleDescription(data: HostListingDescriptionInput): string {
  const city = (data.city || "the area").trim();
  const title = (data.title || `Your stay in ${city}`).trim();
  const type = (data.propertyType || "place").toLowerCase();
  const guests =
    data.maxGuests != null && data.maxGuests > 0 ? ` Hosts up to ${data.maxGuests} guests.` : "";
  const bedLine =
    data.bedrooms != null && data.bedrooms > 0
      ? ` ${data.bedrooms} bedroom${data.bedrooms === 1 ? "" : "s"}.`
      : "";
  const amenityLine =
    data.amenities && data.amenities.length
      ? ` You will love: ${data.amenities.slice(0, 6).join(", ")}.`
      : "";

  return `${title} is a welcoming ${type} in ${city}.${guests}${bedLine}${amenityLine} Quiet after 10 p.m. No parties without host approval. Message us for early check-in or special requests.`.replace(
    /\s+/g,
    " "
  );
}

export async function suggestPrice(city: string, bedrooms: number | null | undefined): Promise<number> {
  const raw = (city || "").trim();
  const bedN = bedrooms != null && bedrooms > 0 ? bedrooms : 1;

  if (raw) {
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
      const base = Math.round(avgCents / 100);
      const bump = Math.round(base * 0.08 * (bedN - 1));
      return Math.max(49, base + bump);
    }
  }

  const byBed = 89 + bedN * 22;
  return Math.max(49, byBed);
}

const AMENITY_BY_TYPE: Record<string, string[]> = {
  apartment: ["WiFi", "Kitchen", "TV", "AC", "Heating"],
  house: ["WiFi", "Kitchen", "Parking", "TV", "AC"],
  condo: ["WiFi", "Kitchen", "AC", "Gym access"],
  other: ["WiFi", "Kitchen", "TV"],
};

/**
 * Friendly amenity labels for checkboxes (matches wizard copy).
 */
export function suggestAmenities(propertyType: string | undefined): string[] {
  const key = (propertyType || "apartment").toLowerCase();
  const normalized = key.includes("house")
    ? "house"
    : key.includes("condo")
      ? "condo"
      : key.includes("apartment") || key.includes("apt")
        ? "apartment"
        : "other";
  const base = AMENITY_BY_TYPE[normalized] ?? AMENITY_BY_TYPE.other;
  return [...base];
}
