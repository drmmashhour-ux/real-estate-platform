import { prisma } from "@/lib/db";
import { FSBO_MODERATION, FSBO_STATUS } from "@/lib/fsbo/constants";
import type { FsboListingOwnerType } from "@prisma/client";

export type PublicListingCard = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string;
  address: string;
  propertyType: string | null;
  listingCode: string | null;
  coverImage: string | null;
};

/**
 * Active, public FSBO rows for a broker or seller workspace (Immobilier Hub).
 */
export async function getPublicListingsForOwner(params: {
  ownerId: string;
  ownerRole: FsboListingOwnerType;
  take?: number;
}): Promise<PublicListingCard[]> {
  const take = Math.min(params.take ?? 48, 48);
  const now = new Date();

  const rows = await prisma.fsboListing.findMany({
    where: {
      ownerId: params.ownerId,
      listingOwnerType: params.ownerRole,
      status: FSBO_STATUS.ACTIVE,
      moderationStatus: FSBO_MODERATION.APPROVED,
      archivedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      city: true,
      address: true,
      propertyType: true,
      listingCode: true,
      coverImage: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    priceCents: r.priceCents,
    city: r.city,
    address: r.address,
    propertyType: r.propertyType,
    listingCode: r.listingCode,
    coverImage: r.coverImage,
  }));
}

export async function resolveShowcaseBrokerUserId(): Promise<string | null> {
  const email = process.env.SHOWCASE_BROKER_EMAIL?.trim() || "info@lecipm.com";
  const u = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  return u?.id ?? null;
}
