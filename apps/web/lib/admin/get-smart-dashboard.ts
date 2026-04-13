import { prisma } from "@/lib/db";
import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import type { AnalyticsFunnelEventName, MarketplacePersona } from "@prisma/client";

export type SmartDashboardFunnelStep = {
  key: string;
  label: string;
  count: number;
};

export type SmartDashboardSegment = {
  key: string;
  label: string;
  count: number;
};

export type SmartDashboardDocTypeRow = { docType: string; count: number };

export type SmartDashboardRevenueBySource = { source: string; cents: number };

export type SmartDashboardTopListing = {
  key: string;
  listingId: string;
  label: string;
  kind: "crm" | "fsbo";
  cents: number;
};

export type SmartDashboardActivityItem =
  | { type: "user"; id: string; title: string; subtitle: string; at: string }
  | { type: "listing"; id: string; title: string; subtitle: string; at: string; kind: "crm" | "fsbo" }
  | { type: "booking"; id: string; title: string; subtitle: string; at: string }
  | { type: "payment"; id: string; title: string; subtitle: string; at: string; cents: number };

export type SmartDashboardAlert = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  href: string;
};

export type SmartDashboardData = {
  windowDays: number;
  kpis: {
    visitors: number;
    activeUsers: number;
    newBuyers: number;
    newSellers: number;
    selfSellers: number;
    brokerAssistedUsers: number;
    documentRequests: number;
    bookings: number;
    revenueCents: number;
  };
  segmentation: SmartDashboardSegment[];
  funnel: SmartDashboardFunnelStep[];
  intentPie: { name: string; value: number }[];
  growthSeries: { date: string; users: number; revenueCents: number }[];
  documents: {
    oaciqPending: number;
    brokerTaxPending: number;
    bnhubPendingDocuments: number;
    fsboPendingDocuments: number;
    byType: SmartDashboardDocTypeRow[];
  };
  revenue: {
    totalCents: number;
    bySource: SmartDashboardRevenueBySource[];
    topListings: SmartDashboardTopListing[];
  };
  activity: SmartDashboardActivityItem[];
  alerts: SmartDashboardAlert[];
};

const FUNNEL_ORDER: AnalyticsFunnelEventName[] = [
  "listing_view",
  "contact_click",
  "visit_request",
  "visit_confirmed",
  "deal_started",
  "payment_completed",
];

const FUNNEL_LABELS: Record<AnalyticsFunnelEventName, string> = {
  listing_view: "Listing views",
  contact_click: "Contact clicks",
  visit_request: "Visit requests",
  visit_confirmed: "Visits confirmed",
  deal_started: "Deals started",
  payment_completed: "Payments",
};

function startOfRollingWindow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getSmartDashboardData(): Promise<SmartDashboardData | null> {
  if (!process.env.DATABASE_URL) return null;

  const windowDays = 30;
  const since = startOfRollingWindow(windowDays);
  const weekAgo = startOfRollingWindow(7);

  try {
    const platformStats = await getPlatformStats(windowDays).catch(() => null);

    const [
      activeUsers,
      newUsersPersona,
      selfSellers,
      brokerAssisted,
      funnelGroups,
      personaGroups,
      roleInvestorCount,
      needsDocsBnhub,
      needsDocsFsbo,
      oaciqPending,
      brokerTaxPending,
      docTypeGroups,
      fsboDocPending,
      paidByType,
      bookingsInWindow,
      revenueWindow,
      recentUsers,
      recentFsbo,
      recentCrm,
      recentBookings,
      recentPayments,
      listingDemand,
      listingLowConversion,
      failedPaymentsRecent,
      dailyUsers,
      dailyPaid,
    ] = await Promise.all([
      prisma.user.count({ where: { updatedAt: { gte: since } } }),
      prisma.user.groupBy({
        by: ["marketplacePersona"],
        where: { createdAt: { gte: weekAgo } },
        _count: { _all: true },
      }),
      prisma.user.count({
        where: {
          marketplacePersona: "SELLER_DIRECT",
          OR: [{ sellerSellingMode: "FREE_HUB" }, { sellerSellingMode: null }],
        },
      }),
      prisma.user.count({
        where: {
          sellerSellingMode: { in: ["PLATFORM_BROKER", "PREFERRED_BROKER"] },
        },
      }),
      prisma.analyticsFunnelEvent.groupBy({
        by: ["name"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ["marketplacePersona"],
        _count: { _all: true },
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
      prisma.fsboListingDocument.groupBy({
        by: ["docType"],
        _count: { _all: true },
      }),
      prisma.fsboListingDocument.count({
        where: { status: { in: ["missing", "pending_review"] } },
      }),
      prisma.platformPayment.groupBy({
        by: ["paymentType"],
        where: { status: "paid", createdAt: { gte: since } },
        _sum: { amountCents: true },
      }),
      prisma.booking.count({ where: { createdAt: { gte: since } } }),
      prisma.platformPayment.aggregate({
        where: { status: "paid", createdAt: { gte: since } },
        _sum: { amountCents: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, email: true, name: true, createdAt: true, marketplacePersona: true },
      }),
      prisma.fsboListing.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, title: true, status: true, createdAt: true, city: true },
      }),
      prisma.listing.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, title: true, createdAt: true, city: true },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, status: true, createdAt: true, totalCents: true },
      }),
      prisma.platformPayment.findMany({
        where: { status: "paid" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          paymentType: true,
          amountCents: true,
          createdAt: true,
          currency: true,
        },
      }),
      prisma.listingAnalytics.findMany({
        where: { demandScore: { gte: 70 }, viewsTotal: { gte: 20 } },
        orderBy: { demandScore: "desc" },
        take: 5,
        select: {
          listingId: true,
          kind: true,
          demandScore: true,
          viewsTotal: true,
          contactClicks: true,
        },
      }),
      prisma.listingAnalytics.findMany({
        where: { viewsTotal: { gte: 40 }, contactClicks: { lte: 2 } },
        orderBy: { viewsTotal: "desc" },
        take: 5,
        select: {
          listingId: true,
          kind: true,
          viewsTotal: true,
          contactClicks: true,
        },
      }),
      prisma.platformPayment.count({
        where: {
          status: "failed",
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.$queryRaw<{ d: Date; c: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS d, COUNT(*)::bigint AS c
        FROM "User"
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
      `.catch(() => [] as { d: Date; c: bigint }[]),
      prisma.$queryRaw<{ d: Date; c: bigint }[]>`
        SELECT date_trunc('day', "created_at") AS d, COALESCE(SUM("amount_cents"), 0)::bigint AS c
        FROM "platform_payments"
        WHERE "status" = 'paid' AND "created_at" >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
      `.catch(() => [] as { d: Date; c: bigint }[]),
    ]);

    const personaMap = new Map<MarketplacePersona, number>(
      personaGroups.map((g) => [g.marketplacePersona, g._count._all])
    );
    const newBuyer =
      newUsersPersona.find((g) => g.marketplacePersona === "BUYER")?._count._all ?? 0;
    const newSeller =
      newUsersPersona.find((g) => g.marketplacePersona === "SELLER_DIRECT")?._count._all ?? 0;

    const funnelCounts = new Map(
      funnelGroups.map((g) => [g.name, g._count._all] as const)
    );
    const funnel: SmartDashboardFunnelStep[] = FUNNEL_ORDER.map((key) => ({
      key,
      label: FUNNEL_LABELS[key],
      count: funnelCounts.get(key) ?? 0,
    }));

    const intentPie = [
      { name: "Buyer", value: personaMap.get("BUYER") ?? 0 },
      { name: "Seller (direct)", value: personaMap.get("SELLER_DIRECT") ?? 0 },
      { name: "Broker", value: personaMap.get("BROKER") ?? 0 },
      { name: "Mortgage broker", value: personaMap.get("MORTGAGE_BROKER") ?? 0 },
      { name: "Unset", value: personaMap.get("UNSET") ?? 0 },
    ].filter((x) => x.value > 0);

    const segmentation: SmartDashboardSegment[] = [
      { key: "buyer", label: "Buyer", count: personaMap.get("BUYER") ?? 0 },
      { key: "seller", label: "Seller", count: personaMap.get("SELLER_DIRECT") ?? 0 },
      {
        key: "self_buyer",
        label: "Self-serve buyer",
        count: personaMap.get("BUYER") ?? 0,
      },
      { key: "self_seller", label: "Self-serve seller (free hub)", count: selfSellers },
      { key: "needs_broker", label: "Broker-assisted (platform/preferred)", count: brokerAssisted },
      {
        key: "needs_documents",
        label: "Listings awaiting documents",
        count: needsDocsListings,
      },
      { key: "investor", label: "Investor role", count: roleInvestorCount },
    ];

    const byType: SmartDashboardDocTypeRow[] = docTypeGroups
      .map((g) => ({ docType: g.docType, count: g._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const revenueBySource: SmartDashboardRevenueBySource[] = paidByType
      .map((r) => ({
        source: r.paymentType || "other",
        cents: r._sum.amountCents ?? 0,
      }))
      .filter((r) => r.cents > 0)
      .sort((a, b) => b.cents - a.cents);

    const [crmByListing, fsboByListing] = await Promise.all([
      prisma.platformPayment.groupBy({
        by: ["listingId"],
        where: { status: "paid", listingId: { not: null } },
        _sum: { amountCents: true },
      }),
      prisma.platformPayment.groupBy({
        by: ["fsboListingId"],
        where: { status: "paid", fsboListingId: { not: null } },
        _sum: { amountCents: true },
      }),
    ]);
    const listingTotals = new Map<string, { cents: number; kind: "crm" | "fsbo" }>();
    for (const row of crmByListing) {
      if (!row.listingId) continue;
      const k = `crm:${row.listingId}`;
      listingTotals.set(k, {
        cents: row._sum.amountCents ?? 0,
        kind: "crm",
      });
    }
    for (const row of fsboByListing) {
      if (!row.fsboListingId) continue;
      listingTotals.set(`fsbo:${row.fsboListingId}`, {
        cents: row._sum.amountCents ?? 0,
        kind: "fsbo",
      });
    }
    const topKeys = [...listingTotals.entries()]
      .sort((a, b) => b[1].cents - a[1].cents)
      .slice(0, 8);
    const fsboIds = topKeys.filter((t) => t[1].kind === "fsbo").map((t) => t[0].replace("fsbo:", ""));
    const crmIds = topKeys.filter((t) => t[1].kind === "crm").map((t) => t[0].replace("crm:", ""));
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
    const titleById = new Map<string, string>();
    for (const l of fsboTitles) titleById.set(l.id, l.title ?? "FSBO listing");
    for (const l of crmTitles) titleById.set(l.id, l.title ?? "Listing");

    const topListings: SmartDashboardTopListing[] = topKeys.map(([key, v]) => {
      const id = key.replace(/^(fsbo|crm):/, "");
      return {
        key,
        listingId: id,
        kind: v.kind,
        cents: v.cents,
        label: titleById.get(id) ?? (v.kind === "fsbo" ? "FSBO" : "CRM"),
      };
    });

    const activity: SmartDashboardActivityItem[] = [];

    for (const u of recentUsers) {
      activity.push({
        type: "user",
        id: u.id,
        title: u.name || u.email || u.id,
        subtitle: `Persona: ${u.marketplacePersona}`,
        at: u.createdAt.toISOString(),
      });
    }
    for (const l of recentFsbo) {
      activity.push({
        type: "listing",
        id: l.id,
        title: l.title ?? "FSBO",
        subtitle: `${l.city ?? ""} · ${l.status}`,
        at: l.createdAt.toISOString(),
        kind: "fsbo",
      });
    }
    for (const l of recentCrm) {
      activity.push({
        type: "listing",
        id: l.id,
        title: l.title ?? "Listing",
        subtitle: l.city ?? "CRM",
        at: l.createdAt.toISOString(),
        kind: "crm",
      });
    }
    for (const b of recentBookings) {
      activity.push({
        type: "booking",
        id: b.id,
        title: `Booking ${b.id.slice(0, 8)}…`,
        subtitle: `${b.status} · total ${(b.totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        at: b.createdAt.toISOString(),
      });
    }
    for (const p of recentPayments) {
      activity.push({
        type: "payment",
        id: p.id,
        title: p.paymentType,
        subtitle: `${(p.amountCents / 100).toFixed(2)} ${p.currency.toUpperCase()}`,
        at: p.createdAt.toISOString(),
        cents: p.amountCents,
      });
    }

    activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const alerts: SmartDashboardAlert[] = [];
    if (failedPaymentsRecent > 0) {
      alerts.push({
        id: "pay-fail",
        severity: "high",
        title: "Payment failures (7d)",
        detail: `${failedPaymentsRecent} failed platform payment(s). Review Stripe and user accounts.`,
        href: "/admin/finance",
      });
    }
    for (const row of listingDemand) {
      alerts.push({
        id: `demand-${row.kind}-${row.listingId}`,
        severity: "medium",
        title: "High demand listing",
        detail: `Score ${row.demandScore} · ${row.viewsTotal} views · ${row.contactClicks} contacts`,
        href:
          row.kind === "FSBO"
            ? `/admin/fsbo?highlight=${row.listingId}`
            : `/admin/listings?highlight=${row.listingId}`,
      });
    }
    for (const row of listingLowConversion) {
      alerts.push({
        id: `lowc-${row.kind}-${row.listingId}`,
        severity: "low",
        title: "Low conversion vs traffic",
        detail: `${row.viewsTotal} views but only ${row.contactClicks} contact clicks`,
        href:
          row.kind === "FSBO"
            ? `/admin/fsbo?highlight=${row.listingId}`
            : `/admin/listings?highlight=${row.listingId}`,
      });
    }

    const growthMap = new Map<string, { users: number; revenueCents: number }>();
    for (const row of dailyUsers) {
      const key = row.d.toISOString().slice(0, 10);
      const cur = growthMap.get(key) ?? { users: 0, revenueCents: 0 };
      cur.users = Number(row.c);
      growthMap.set(key, cur);
    }
    for (const row of dailyPaid) {
      const key = row.d.toISOString().slice(0, 10);
      const cur = growthMap.get(key) ?? { users: 0, revenueCents: 0 };
      cur.revenueCents = Number(row.c);
      growthMap.set(key, cur);
    }
    const growthSeries = [...growthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), ...v }));

    const needsDocsListings = needsDocsBnhub + needsDocsFsbo;
    const documentRequests = oaciqPending + brokerTaxPending + fsboDocPending;

    return {
      windowDays,
      kpis: {
        visitors: platformStats?.totals.visitors ?? 0,
        activeUsers,
        newBuyers: newBuyer,
        newSellers: newSeller,
        selfSellers,
        brokerAssistedUsers: brokerAssisted,
        documentRequests,
        bookings: bookingsInWindow,
        revenueCents: revenueWindow._sum.amountCents ?? 0,
      },
      segmentation,
      funnel,
      intentPie,
      growthSeries,
      documents: {
        oaciqPending,
        brokerTaxPending,
        bnhubPendingDocuments: needsDocsBnhub,
        fsboPendingDocuments: needsDocsFsbo,
        byType: byType,
      },
      revenue: {
        totalCents: revenueWindow._sum.amountCents ?? 0,
        bySource: revenueBySource,
        topListings,
      },
      activity: activity.slice(0, 24),
      alerts,
    };
  } catch {
    return null;
  }
}
