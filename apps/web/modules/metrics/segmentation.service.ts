import type { Prisma } from "@prisma/client";
import type { MetricsSegment } from "./metrics.types";

/** Best-effort FSBO filters for segmented aggregates (city is primary). */
export function buildFsboSegmentWhere(segment: MetricsSegment): Prisma.FsboListingWhereInput {
  const and: Prisma.FsboListingWhereInput[] = [];
  if (segment.city?.trim()) {
    and.push({ city: { equals: segment.city.trim(), mode: "insensitive" } });
  }
  if (segment.neighborhood?.trim()) {
    and.push({ address: { contains: segment.neighborhood.trim(), mode: "insensitive" } });
  }
  if (segment.priceMinCents != null || segment.priceMaxCents != null) {
    and.push({
      priceCents: {
        gte: segment.priceMinCents ?? undefined,
        lte: segment.priceMaxCents ?? undefined,
      },
    });
  }
  return and.length ? { AND: and } : {};
}

export function parseSegmentFromSearchParams(sp: URLSearchParams): MetricsSegment {
  const city = sp.get("city") ?? undefined;
  const neighborhood = sp.get("neighborhood") ?? undefined;
  const propertyType = sp.get("propertyType") ?? undefined;
  const priceMin = sp.get("priceMinCents");
  const priceMax = sp.get("priceMaxCents");
  const userRole = sp.get("userRole") as MetricsSegment["userRole"] | null;
  const listingChannel = sp.get("listingChannel") as MetricsSegment["listingChannel"] | null;
  return {
    city,
    neighborhood,
    propertyType,
    priceMinCents: priceMin ? parseInt(priceMin, 10) : undefined,
    priceMaxCents: priceMax ? parseInt(priceMax, 10) : undefined,
    userRole: userRole ?? undefined,
    listingChannel: listingChannel ?? undefined,
  };
}
