import { ListingAnalyticsKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import type {
  PlatformSignals,
  PlatformSignalsConversion,
  PlatformSignalsFunnelStep,
  PlatformSignalsListings,
  PlatformSignalsRevenue,
  PlatformSignalsSupport,
  PlatformSignalsTraffic,
  PlatformSignalsUsers,
} from "./types";

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function sumVisitorsBetween(start: Date, endExclusive: Date): Promise<number> {
  const rows = await prisma.platformAnalytics.findMany({
    where: { date: { gte: start, lt: endExclusive } },
    select: { visitors: true },
  });
  let s = 0;
  for (const r of rows) s += r.visitors;
  return s;
}

const FUNNEL_NAMES = [
  "listing_view",
  "contact_click",
  "visit_request",
  "visit_confirmed",
  "deal_started",
  "payment_completed",
] as const;

export async function getPlatformSignals(): Promise<PlatformSignals | null> {
  if (!process.env.DATABASE_URL) return null;

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  /** Same window as getPlatformStats(7): last 7 UTC calendar days including today. */
  const rangeStart = addUtcDays(todayStart, -(7 - 1));
  const rangeEndExclusive = addUtcDays(todayStart, 1);
  const prevRangeStart = addUtcDays(todayStart, -(14 - 1));
  const prevRangeEndExclusive = rangeStart;

  try {
    const [
      stats7,
      visitorsPrev,
      trafficPageViews,
      trafficSources,
      sessionRows,
      funnelCurr,
      funnelPrev,
      buyers7,
      sellers7,
      selfSellers,
      brokerAssisted,
      investors,
      needsDocsBnhub,
      needsDocsFsbo,
      oaciqPending,
      brokerTaxPending,
      listingAnalyticsLowConv,
      listingDemand,
      fsboNoPhotos,
      fsboCandidates,
      newlyActive,
      paymentFails,
      forms7,
      formsPrev,
      rev7,
      revPrev,
      paidByType,
      crmRev,
      fsboRev,
      buyerSaves,
      stNew7,
      fsboNonDraftTotal,
    ] = await Promise.all([
      getPlatformStats(7),
      sumVisitorsBetween(prevRangeStart, prevRangeEndExclusive),
      prisma.trafficEvent.count({
        where: {
          eventType: "page_view",
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
        },
      }),
      prisma.trafficEvent.groupBy({
        by: ["source"],
        where: { createdAt: { gte: rangeStart, lt: rangeEndExclusive } },
        _count: { _all: true },
      }),
      prisma.analyticsFunnelEvent.groupBy({
        by: ["sessionId"],
        where: {
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
          sessionId: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.analyticsFunnelEvent.groupBy({
        by: ["name"],
        where: { createdAt: { gte: rangeStart, lt: rangeEndExclusive } },
        _count: { _all: true },
      }),
      prisma.analyticsFunnelEvent.groupBy({
        by: ["name"],
        where: { createdAt: { gte: prevRangeStart, lt: prevRangeEndExclusive } },
        _count: { _all: true },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
          marketplacePersona: "BUYER",
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
          marketplacePersona: "SELLER_DIRECT",
        },
      }),
      prisma.user.count({
        where: {
          marketplacePersona: "SELLER_DIRECT",
          OR: [{ sellerSellingMode: "FREE_HUB" }, { sellerSellingMode: null }],
        },
      }),
      prisma.user.count({
        where: { sellerSellingMode: { in: ["PLATFORM_BROKER", "PREFERRED_BROKER"] } },
      }),
      prisma.user.count({ where: { role: "INVESTOR" } }),
      prisma.shortTermListing.count({
        where: { listingVerificationStatus: "PENDING_DOCUMENTS" },
      }),
      prisma.fsboListing.count({
        where: {
          documents: { some: { status: { in: ["missing", "pending_review"] } } },
        },
      }),
      prisma.brokerVerification.count({ where: { verificationStatus: "PENDING" } }),
      prisma.brokerTaxRegistration.count({
        where: { status: { in: ["PENDING_STAFF_REVIEW", "SUBMITTED", "FORMAT_VALID"] } },
      }),
      prisma.listingAnalytics.findMany({
        where: {
          viewsTotal: { gte: 30 },
          contactClicks: { lte: 2 },
        },
        orderBy: { viewsTotal: "desc" },
        take: 12,
        select: {
          listingId: true,
          kind: true,
          viewsTotal: true,
          contactClicks: true,
          demandScore: true,
        },
      }),
      prisma.listingAnalytics.findMany({
        where: { demandScore: { gte: 65 } },
        orderBy: { demandScore: "desc" },
        take: 8,
        select: { listingId: true, kind: true, demandScore: true, viewsTotal: true },
      }),
      prisma.fsboListing.findMany({
        where: { images: { equals: [] } },
        take: 15,
        select: { id: true, title: true },
      }),
      prisma.fsboListing.findMany({
        take: 60,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, description: true },
      }),
      prisma.fsboListing.count({
        where: {
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
          NOT: { status: "DRAFT" },
        },
      }),
      prisma.platformPayment.count({
        where: {
          status: "failed",
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
        },
      }),
      prisma.formSubmission.count({
        where: { createdAt: { gte: rangeStart, lt: rangeEndExclusive } },
      }),
      prisma.formSubmission.count({
        where: { createdAt: { gte: prevRangeStart, lt: prevRangeEndExclusive } },
      }),
      prisma.platformPayment.aggregate({
        where: { status: "paid", createdAt: { gte: rangeStart, lt: rangeEndExclusive } },
        _sum: { amountCents: true },
      }),
      prisma.platformPayment.aggregate({
        where: { status: "paid", createdAt: { gte: prevRangeStart, lt: prevRangeEndExclusive } },
        _sum: { amountCents: true },
      }),
      prisma.platformPayment.groupBy({
        by: ["paymentType"],
        where: { status: "paid", createdAt: { gte: rangeStart, lt: rangeEndExclusive } },
        _sum: { amountCents: true },
      }),
      prisma.platformPayment.groupBy({
        by: ["listingId"],
        where: {
          status: "paid",
          listingId: { not: null },
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
        },
        _sum: { amountCents: true },
      }),
      prisma.platformPayment.groupBy({
        by: ["fsboListingId"],
        where: {
          status: "paid",
          fsboListingId: { not: null },
          createdAt: { gte: rangeStart, lt: rangeEndExclusive },
        },
        _sum: { amountCents: true },
      }),
      prisma.buyerSavedListing.count({
        where: { createdAt: { gte: rangeStart, lt: rangeEndExclusive } },
      }),
      prisma.shortTermListing.count({
        where: { createdAt: { gte: rangeStart, lt: rangeEndExclusive } },
      }),
      prisma.fsboListing.count({ where: { NOT: { status: "DRAFT" } } }),
    ]);

    const analyticsSessions = sessionRows.length;

    const funnelCurrMap = new Map(funnelCurr.map((f) => [f.name, f._count._all]));
    const funnelPrevMap = new Map(funnelPrev.map((f) => [f.name, f._count._all]));
    const funnel: PlatformSignalsFunnelStep[] = FUNNEL_NAMES.map((name) => ({
      name,
      count7d: funnelCurrMap.get(name) ?? 0,
      countPrev7d: funnelPrevMap.get(name) ?? 0,
    }));

    const conversion: PlatformSignalsConversion = {
      contactClicks: funnelCurrMap.get("contact_click") ?? 0,
      visitRequests: funnelCurrMap.get("visit_request") ?? 0,
      bookingStarts: funnelCurrMap.get("visit_confirmed") ?? 0,
      paymentCompletions: funnelCurrMap.get("payment_completed") ?? 0,
      savesApprox: buyerSaves,
    };

    const listingViewsApprox = await prisma.buyerListingView
      .count({
        where: { createdAt: { gte: rangeStart, lt: rangeEndExclusive } },
      })
      .catch(() => 0);

    const traffic: PlatformSignalsTraffic = {
      visitors: stats7.totals.visitors,
      visitorsPrevWeek: visitorsPrev,
      analyticsSessions,
      pageViews: trafficPageViews,
      sourceBreakdown: trafficSources
        .map((s) => ({ source: s.source ?? "(direct)", count: s._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
      listingViewsApprox,
    };

    const users: PlatformSignalsUsers = {
      newBuyers7d: buyers7,
      newSellers7d: sellers7,
      selfSellers,
      brokerAssisted,
      investors,
      shortStayHostsOrBnhub: stNew7,
      documentHelpBnhub: needsDocsBnhub,
      documentHelpFsboListings: needsDocsFsbo,
      oaciqBrokerLicensePending: oaciqPending,
      brokerTaxPending,
    };

    const fsboWeakDesc = fsboCandidates
      .filter((r) => (r.description ?? "").length > 0 && (r.description ?? "").length < 200)
      .slice(0, 12)
      .map((l) => ({
        id: l.id,
        kind: "fsbo" as const,
        title: l.title,
        charCount: (l.description ?? "").length,
      }));

    const listings: PlatformSignalsListings = {
      highTrafficLowConversion: listingAnalyticsLowConv.map((r) => ({
        listingId: r.listingId,
        kind:
          r.kind === ListingAnalyticsKind.FSBO
            ? "FSBO"
            : r.kind === ListingAnalyticsKind.CRM
              ? "CRM"
              : "BNHUB",
        views: r.viewsTotal,
        contacts: r.contactClicks,
        demandScore: r.demandScore,
      })),
      missingPhotos: fsboNoPhotos.map((l) => ({
        id: l.id,
        kind: "fsbo" as const,
        title: l.title,
      })),
      weakDescriptions: fsboWeakDesc,
      newlyActive7d: newlyActive,
      trendingByDemand: listingDemand.map((r) => ({
        listingId: r.listingId,
        kind:
          r.kind === ListingAnalyticsKind.FSBO
            ? "FSBO"
            : r.kind === ListingAnalyticsKind.CRM
              ? "CRM"
              : "BNHUB",
        demandScore: r.demandScore,
      })),
    };

    let bnhubBookingCents = 0;
    let listingFeesCents = 0;
    let brokerLeadFeesCents = 0;
    let featuredCents = 0;
    for (const row of paidByType) {
      const c = row._sum.amountCents ?? 0;
      const t = (row.paymentType ?? "").toLowerCase();
      if (t.includes("booking") || t.includes("bnhub") || t.includes("stay")) {
        bnhubBookingCents += c;
      } else if (t.includes("lead") || t.includes("unlock")) {
        brokerLeadFeesCents += c;
      } else if (t.includes("feature") || t.includes("promo") || t.includes("sponsor")) {
        featuredCents += c;
      } else if (t.includes("fsbo") || t.includes("publish") || t.includes("listing")) {
        listingFeesCents += c;
      }
    }

    const crmIds = crmRev.map((r) => r.listingId).filter(Boolean) as string[];
    const fsboIds = fsboRev.map((r) => r.fsboListingId).filter(Boolean) as string[];
    const [fsboTitles, crmTitles] = await Promise.all([
      fsboIds.length
        ? prisma.fsboListing.findMany({
            where: { id: { in: fsboIds } },
            select: { id: true, title: true },
          })
        : [],
      crmIds.length
        ? prisma.listing.findMany({
            where: { id: { in: crmIds } },
            select: { id: true, title: true },
          })
        : [],
    ]);
    const titleBy = new Map<string, string>();
    for (const x of fsboTitles) titleBy.set(x.id, x.title ?? "FSBO");
    for (const x of crmTitles) titleBy.set(x.id, x.title ?? "CRM listing");

    const topEarners: PlatformSignalsRevenue["topListingEarners"] = [];
    for (const r of fsboRev) {
      if (!r.fsboListingId) continue;
      topEarners.push({
        key: `fsbo:${r.fsboListingId}`,
        listingId: r.fsboListingId,
        kind: "fsbo",
        label: titleBy.get(r.fsboListingId) ?? "FSBO",
        cents: r._sum.amountCents ?? 0,
      });
    }
    for (const r of crmRev) {
      if (!r.listingId) continue;
      topEarners.push({
        key: `crm:${r.listingId}`,
        listingId: r.listingId,
        kind: "crm",
        label: titleBy.get(r.listingId) ?? "CRM",
        cents: r._sum.amountCents ?? 0,
      });
    }
    topEarners.sort((a, b) => b.cents - a.cents);

    const revenue: PlatformSignalsRevenue = {
      totalCents7d: rev7._sum.amountCents ?? 0,
      totalCentsPrev7d: revPrev._sum.amountCents ?? 0,
      byPaymentType7d: paidByType
        .map((p) => ({
          paymentType: p.paymentType,
          cents: p._sum.amountCents ?? 0,
        }))
        .filter((x) => x.cents > 0)
        .sort((a, b) => b.cents - a.cents),
      bnhubBookingCents7d: bnhubBookingCents,
      listingFeesCents7d: listingFeesCents,
      brokerLeadFeesCents7d: brokerLeadFeesCents,
      featuredOrPromotionCents7d: featuredCents,
      topListingEarners: topEarners.slice(0, 10),
    };

    const support: PlatformSignalsSupport = {
      paymentFailures7d: paymentFails,
      formSubmissions7d: forms7,
      formSubmissionsPrev7d: formsPrev,
    };

    return {
      generatedAt: now.toISOString(),
      window: {
        label: "last_7d",
        start: utcDayKey(rangeStart),
        end: utcDayKey(addUtcDays(todayStart, 0)),
      },
      comparisonWindow: {
        label: "prev_7d",
        start: utcDayKey(prevRangeStart),
        end: utcDayKey(addUtcDays(prevRangeEndExclusive, -1)),
      },
      inventory: {
        fsboNonDraftCount: fsboNonDraftTotal,
      },
      traffic,
      conversion,
      users,
      listings,
      revenue,
      support,
      funnel,
    };
  } catch {
    return null;
  }
}
