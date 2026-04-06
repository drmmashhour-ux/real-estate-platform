import { prisma } from "@/lib/db";
import { buildFsboPublicVisibilityWhere } from "@/lib/fsbo/listing-expiry";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";

export type FsboCollectionCard = {
  id: string;
  title: string;
  city: string;
  priceCents: number;
  bedrooms: number | null;
  coverImage: string | null;
  images: unknown;
  href: string;
};

function toCard(row: {
  id: string;
  title: string;
  city: string;
  priceCents: number;
  bedrooms: number | null;
  coverImage: string | null;
  images: unknown;
  propertyType: string | null;
}): FsboCollectionCard {
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    priceCents: row.priceCents,
    bedrooms: row.bedrooms,
    coverImage: row.coverImage,
    images: row.images,
    href: buildFsboPublicListingPath({
      id: row.id,
      city: row.city,
      propertyType: row.propertyType,
    }),
  };
}

const select = {
  id: true,
  title: true,
  city: true,
  priceCents: true,
  bedrooms: true,
  coverImage: true,
  images: true,
  propertyType: true,
} as const;

export async function getFsboTopListings(take = 24): Promise<FsboCollectionCard[]> {
  const rows = await prisma.fsboListing.findMany({
    where: buildFsboPublicVisibilityWhere(),
    orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    take,
    select,
  });
  return rows.map(toCard);
}

export async function getFsboAffordableListings(take = 24): Promise<FsboCollectionCard[]> {
  const rows = await prisma.fsboListing.findMany({
    where: buildFsboPublicVisibilityWhere(),
    orderBy: { priceCents: "asc" },
    take,
    select,
  });
  return rows.map(toCard);
}

export async function getFsboLuxuryListings(take = 24): Promise<FsboCollectionCard[]> {
  const rows = await prisma.fsboListing.findMany({
    where: buildFsboPublicVisibilityWhere(),
    orderBy: { priceCents: "desc" },
    take,
    select,
  });
  return rows.map(toCard);
}
