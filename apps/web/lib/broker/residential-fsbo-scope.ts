import type { PlatformRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Québec residential sale listings the broker publishes as broker-managed inventory. */
export function residentialBrokerFsboWhere(brokerId: string): Prisma.FsboListingWhereInput {
  return {
    listingOwnerType: "BROKER",
    ownerId: brokerId,
    listingDealType: "SALE",
  };
}

export async function getBrokerResidentialListingIds(brokerId: string): Promise<string[]> {
  const rows = await prisma.fsboListing.findMany({
    where: residentialBrokerFsboWhere(brokerId),
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function assertBrokerResidentialFsboListing(params: {
  brokerId: string;
  listingId: string;
  role: PlatformRole;
}) {
  if (params.role === "ADMIN") {
    return prisma.fsboListing.findFirst({
      where: { id: params.listingId, listingDealType: "SALE" },
    select: BROKER_FSBO_LISTING_SELECT,
  });
  }
  return prisma.fsboListing.findFirst({
    where: { id: params.listingId, ...residentialBrokerFsboWhere(params.brokerId) },
    select: BROKER_FSBO_LISTING_SELECT,
  });
}

const BROKER_FSBO_LISTING_SELECT = {
  id: true,
  title: true,
  titleFr: true,
  description: true,
  city: true,
  region: true,
  priceCents: true,
  status: true,
  images: true,
  coverImage: true,
  createdAt: true,
  updatedAt: true,
  listingCode: true,
  propertyType: true,
  bedrooms: true,
  bathrooms: true,
  moderationStatus: true,
  sellerDeclarationCompletedAt: true,
} satisfies Prisma.FsboListingSelect;

export type BrokerResidentialFsboListing = NonNullable<
  Awaited<ReturnType<typeof assertBrokerResidentialFsboListing>>
>;
