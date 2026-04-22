import { prisma } from "@/lib/db";

import type { SellerDashboardData, SellerLuxuryDashboardData } from "../view-models";

import { formatCadFromCents } from "./format-dashboard-currency";

export async function getSellerDashboardData(userId: string): Promise<SellerDashboardData> {
  const [listingsOwned, publishedListings, pendingReview] = await Promise.all([
    prisma.fsboListing.count({ where: { ownerId: userId } }),
    prisma.fsboListing.count({
      where: { ownerId: userId, status: "ACTIVE" },
    }),
    prisma.fsboListing.count({
      where: { ownerId: userId, status: "PENDING_VERIFICATION" },
    }),
  ]);

  return { listingsOwned, publishedListings, pendingReview };
}

export async function getSellerLuxuryDashboardData(userId: string): Promise<SellerLuxuryDashboardData> {
  const since30 = new Date(Date.now() - 30 * 86400000);

  const myListingIds = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const idList = myListingIds.map((x) => x.id);

  const [summary, listingsRaw, leadsRaw, viewsAgg, incompleteDocs] = await Promise.all([
    getSellerDashboardData(userId),
    prisma.fsboListing.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        status: true,
        priceCents: true,
      },
    }),
    prisma.fsboLead.findMany({
      where: { listing: { ownerId: userId } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        listing: { select: { title: true } },
      },
    }),
    idList.length === 0
      ? Promise.resolve([] as Array<{ fsboListingId: string; _count: { id: number } }>)
      : prisma.buyerListingView.groupBy({
          by: ["fsboListingId"],
          where: {
            fsboListingId: { in: idList },
            createdAt: { gte: since30 },
          },
          _count: { id: true },
        }),
    prisma.fsboListing.count({
      where: {
        ownerId: userId,
        OR: [{ status: "DRAFT" }, { status: "PENDING_VERIFICATION" }],
      },
    }),
  ]);

  const viewsByListing = new Map(viewsAgg.map((v) => [v.fsboListingId, v._count.id]));

  const listings = listingsRaw.map((l) => ({
    id: l.id,
    title: l.title,
    statusLabel: l.status.replace(/_/g, " "),
    priceDisplay: formatCadFromCents(l.priceCents),
    views30d: viewsByListing.get(l.id) ?? 0,
  }));

  const leads = leadsRaw.map((lead) => ({
    id: lead.id,
    listingId: lead.listingId,
    contactName: lead.name,
    interestLine: lead.message?.trim() ? lead.message.trim().slice(0, 80) : "New inquiry",
    propertyTitle: lead.listing.title,
  }));

  const leadsTotal = await prisma.fsboLead.count({
    where: { listing: { ownerId: userId } },
  });

  const viewsLast30d = viewsAgg.reduce((s, v) => s + v._count.id, 0);

  return {
    stats: {
      listingsOwned: summary.listingsOwned,
      publishedListings: summary.publishedListings,
      pendingReview: summary.pendingReview,
      leadsTotal,
      viewsLast30d,
      documentsIncomplete: incompleteDocs,
    },
    listings,
    leads,
  };
}
