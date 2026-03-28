import type { FsboListing, Listing } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { normalizeAnyPublicListingCode } from "@/lib/listing-code-public";

export type ResolvedPublicListing =
  | { kind: "fsbo"; row: FsboListing }
  | { kind: "crm"; row: Listing & { owner?: { id: string; email: string | null; name: string | null } | null } }
  | { kind: "bnhub"; slug: string; id: string; city: string; propertyType: string | null };

/**
 * Resolve `/listings/[id]` to FSBO, CRM `Listing`, or BNHub `ShortTermListing` (by uuid or public code).
 */
export async function resolvePublicListing(idOrCode: string): Promise<ResolvedPublicListing | null> {
  const raw = idOrCode.trim();
  if (!raw) return null;

  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: raw },
  });
  if (fsbo && isFsboPubliclyVisible(fsbo)) {
    return { kind: "fsbo", row: fsbo };
  }

  const crm = await prisma.listing.findUnique({
    where: { id: raw },
    include: { owner: { select: { id: true, email: true, name: true } } },
  });
  if (crm) {
    return { kind: "crm", row: crm };
  }

  const code = normalizeAnyPublicListingCode(raw);
  const bnWhere =
    code != null
      ? { listingCode: { equals: code, mode: "insensitive" as const } }
      : { id: raw };

  const bn = await prisma.shortTermListing.findFirst({
    where: bnWhere,
    select: { id: true, listingCode: true, listingStatus: true, city: true, propertyType: true },
  });
  if (bn && bn.listingStatus === "PUBLISHED") {
    return {
      kind: "bnhub",
      slug: bn.listingCode || bn.id,
      id: bn.id,
      city: bn.city,
      propertyType: bn.propertyType,
    };
  }

  return null;
}

export function mapCrmListingToBuyerPayload(row: Listing & { owner?: { email: string | null; name: string | null } | null }) {
  const priceCents = Math.round(Number(row.price) * 100);
  return {
    id: row.id,
    listingCode: row.listingCode,
    ownerId: row.ownerId ?? "",
    title: row.title,
    description:
      `Listed on the LECIPM marketplace. Asking price ${(Number(row.price) || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}. Contact the listing representative for details, showings, and documents.`,
    priceCents,
    address: "See listing representative",
    city: "Marketplace",
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    surfaceSqft: null as number | null,
    images: [] as string[],
    coverImage: null as string | null,
    contactEmail: row.owner?.email ?? "contact@lecipm.com",
    contactPhone: null as string | null,
    propertyType: "RESIDENTIAL" as string | null,
    yearBuilt: null as number | null,
    annualTaxesCents: null as number | null,
    condoFeesCents: null as number | null,
    cadastreNumber: null as string | null,
    listingKind: "crm" as const,
  };
}
