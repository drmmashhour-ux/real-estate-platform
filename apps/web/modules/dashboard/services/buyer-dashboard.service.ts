import { AppointmentStatus, BnhubDiscoveryAlertType } from "@prisma/client";

import { prisma } from "@/lib/db";

import type { BuyerDashboardData, BuyerLuxuryDashboardData } from "../view-models";

import { formatCadFromCents } from "./format-dashboard-currency";

const RECOMMEND_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=1400&q=80";

export async function getBuyerDashboardData(userId: string): Promise<BuyerDashboardData> {
  const since = new Date(Date.now() - 30 * 86400000);

  const [savedHomesCount, savedSearchesCount, listingViewsLast30d, discoveryAlertsActive] =
    await Promise.all([
      prisma.buyerSavedListing.count({ where: { userId } }),
      prisma.savedSearch.count({ where: { userId } }),
      prisma.buyerListingView.count({ where: { userId, createdAt: { gte: since } } }),
      prisma.bnhubDiscoveryAlert.count({ where: { userId, active: true } }),
    ]);

  return {
    savedHomesCount,
    savedSearchesCount,
    listingViewsLast30d,
    alertsEnabledCount: discoveryAlertsActive,
  };
}

function heroImage(listing: { coverImage: string | null; images: string[] }): string {
  const c = listing.coverImage?.trim();
  if (c) return c;
  const first = listing.images?.[0]?.trim();
  if (first) return first;
  return RECOMMEND_PLACEHOLDER_IMAGE;
}

function statusCopy(raw: string): string {
  switch (raw) {
    case "ACTIVE":
      return "Live on marketplace";
    case "PENDING_VERIFICATION":
      return "Verification queue";
    case "DRAFT":
      return "Draft";
    case "SOLD":
      return "Sold";
    default:
      return raw.replace(/_/g, " ");
  }
}

export async function getBuyerLuxuryDashboardData(
  userId: string,
  listingBasePath: string
): Promise<BuyerLuxuryDashboardData> {
  const now = new Date();
  const since30 = new Date(Date.now() - 30 * 86400000);
  const since7 = new Date(Date.now() - 7 * 86400000);

  const [
    base,
    upcomingVisits,
    priceAlertsWeek,
    newMatchesWeek,
    recommendedRaw,
    savedRaw,
    alertRows,
  ] = await Promise.all([
    getBuyerDashboardData(userId),
    prisma.appointment.count({
      where: {
        clientUserId: userId,
        startsAt: { gte: now },
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULE_REQUESTED,
          ],
        },
      },
    }),
    prisma.bnhubDiscoveryAlert.count({
      where: {
        userId,
        active: true,
        alertType: BnhubDiscoveryAlertType.PRICE_DROP,
        updatedAt: { gte: since7 },
      },
    }),
    prisma.buyerListingView.count({
      where: { userId, createdAt: { gte: since7 } },
    }),
    prisma.fsboListing.findMany({
      where: { status: "ACTIVE", moderationStatus: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        city: true,
        priceCents: true,
        coverImage: true,
        images: true,
      },
    }),
    prisma.buyerSavedListing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        fsboListing: {
          select: {
            id: true,
            title: true,
            city: true,
            priceCents: true,
            status: true,
          },
        },
      },
    }),
    prisma.bnhubDiscoveryAlert.findMany({
      where: { userId, active: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { alertType: true, city: true },
    }),
  ]);

  const recommendations = recommendedRaw.map((l) => ({
    id: l.id,
    title: l.title,
    location: l.city,
    priceDisplay: formatCadFromCents(l.priceCents),
    imageUrl: heroImage(l),
    listingHref: `${listingBasePath}/listings/${l.id}`,
  }));

  const savedHomes = savedRaw.map((row) => ({
    id: row.fsboListing.id,
    title: row.fsboListing.title,
    statusLine: statusCopy(row.fsboListing.status),
    priceDisplay: formatCadFromCents(row.fsboListing.priceCents),
  }));

  const alerts =
    alertRows.length > 0
      ? alertRows.map((a) => {
          const kind = a.alertType.replace(/_/g, " ");
          return a.city ? `${kind} — ${a.city}` : kind;
        })
      : [
          base.savedSearchesCount > 0
            ? `${base.savedSearchesCount} saved search${base.savedSearchesCount === 1 ? "" : "es"} active — we will notify you on matches.`
            : "Save a search to receive BNHub-style discovery alerts.",
        ];

  return {
    stats: {
      savedHomesCount: base.savedHomesCount,
      savedSearchesCount: base.savedSearchesCount,
      newMatchesWeek,
      priceAlertsWeek,
      visitsPlanned: upcomingVisits,
      discoveryAlertsActive: base.alertsEnabledCount,
      listingViewsLast30d: base.listingViewsLast30d,
    },
    recommendations,
    savedHomes,
    alerts,
  };
}
