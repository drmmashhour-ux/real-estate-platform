import type { FsboListing } from "@prisma/client";

/** Flatten FSBO + optional declaration hints for difference / adjustment engines. */
export function buildValuationRecordFromListing(
  listing: Pick<
    FsboListing,
    | "id"
    | "address"
    | "city"
    | "priceCents"
    | "surfaceSqft"
    | "bedrooms"
    | "bathrooms"
    | "yearBuilt"
    | "propertyType"
    | "sellerDeclarationJson"
  >,
  role: "subject" | "comparable",
): Record<string, unknown> {
  const decl =
    listing.sellerDeclarationJson && typeof listing.sellerDeclarationJson === "object"
      ? (listing.sellerDeclarationJson as Record<string, unknown>)
      : {};

  const pickNum = (k: string): number | undefined => (typeof decl[k] === "number" ? (decl[k] as number) : undefined);
  const pickStr = (k: string): string | undefined => (typeof decl[k] === "string" ? (decl[k] as string) : undefined);
  const pickBool = (k: string): boolean | undefined =>
    typeof decl[k] === "boolean" ? (decl[k] as boolean) : undefined;

  const base: Record<string, unknown> = {
    listingId: listing.id,
    address: listing.address,
    city: listing.city,
    propertyType: listing.propertyType,
    buildingAreaSqft: listing.surfaceSqft ?? undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    yearBuilt: listing.yearBuilt ?? undefined,
    lotAreaSqft: pickNum("lotAreaSqft"),
    frontage: pickNum("frontageFt") ?? pickNum("frontage"),
    depth: pickNum("lotDepthFt") ?? pickNum("depthFt"),
    shape: pickStr("lotShape") ?? pickStr("shape"),
    cornerLot: pickBool("cornerLot"),
    conditionRating: pickNum("conditionRating"),
    locationRating: pickNum("neighborhoodRating") ?? pickNum("locationRating"),
    utilities: pickStr("utilitiesSummary") ?? pickStr("utilities"),
  };

  if (role === "comparable") {
    base.salePriceCents = listing.priceCents;
  }

  return base;
}

export function mergeAssumptions(
  record: Record<string, unknown>,
  assumptions: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!assumptions || typeof assumptions !== "object") return record;
  return { ...record, ...assumptions };
}
