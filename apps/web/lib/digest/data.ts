import { prisma } from "@/lib/db";

export type DigestWindow = {
  sinceIso: string;
  untilIso: string;
  label: string;
};

export type MarketZoneRow = {
  regionSlug: string;
  propertyType: string;
  mode: string;
  snapshotDate: string;
  medianPriceCents: string | null;
  medianPricePerSqft: string | null;
  activeListingCount: number;
  newListingCount: number;
  confidenceLevel: string;
  directionLabel: string | null;
};

function startOfUtcYesterday(d: Date): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() - 1);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function digestDayUtc(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function summarizeFilters(filtersJson: unknown): { keys: string[]; preview: string } {
  if (!filtersJson || typeof filtersJson !== "object") {
    return { keys: [], preview: "" };
  }
  const keys = Object.keys(filtersJson as Record<string, unknown>).slice(0, 24);
  let preview = "";
  try {
    preview = JSON.stringify(filtersJson).slice(0, 1200);
  } catch {
    preview = "";
  }
  return { keys, preview };
}

export async function buildDigestData(ownerType: string, ownerId: string) {
  const now = new Date();
  const since = startOfUtcYesterday(now);

  const window: DigestWindow = {
    sinceIso: since.toISOString(),
    untilIso: now.toISOString(),
    label: "Aggregates from start of yesterday (UTC) through now",
  };

  const userId = ownerId;

  const dealWhere =
    ownerType === "solo_broker"
      ? {
          brokerId: userId,
          createdAt: { gte: since },
        }
      : {
          OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
          createdAt: { gte: since },
        };

  const [
    watchlistAlerts,
    alertCandidates,
    deals,
    savedSearches,
    watchlistItemsAdded,
    watchlistSnapshots,
    investorPortfolioRows,
    investmentDeals,
    rawSnapshots,
    workspaceZones,
    workflows,
  ] = await Promise.all([
    prisma.watchlistAlert.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        alertType: true,
        severity: true,
        title: true,
        message: true,
        listingId: true,
        createdAt: true,
      },
    }),
    prisma.alertCandidate.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        type: true,
        status: true,
        listingId: true,
        createdAt: true,
        payload: true,
      },
    }),
    prisma.deal.findMany({
      where: dealWhere,
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        dealCode: true,
        listingCode: true,
        status: true,
        crmStage: true,
        priceCents: true,
        createdAt: true,
        brokerId: true,
      },
    }),
    prisma.savedSearch.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        mode: true,
        name: true,
        createdAt: true,
        filtersJson: true,
      },
    }),
    prisma.watchlistItem.findMany({
      where: {
        watchlist: { userId },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, listingId: true, watchlistId: true, createdAt: true },
    }),
    prisma.watchlistSnapshot.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        listingId: true,
        dealScore: true,
        trustScore: true,
        recommendation: true,
        createdAt: true,
      },
    }),
    prisma.investorPortfolio.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        projectId: true,
        unitId: true,
        purchasePrice: true,
        currentValue: true,
        createdAt: true,
      },
    }),
    prisma.investmentDeal.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        city: true,
        rating: true,
        roi: true,
        riskScore: true,
        preferredStrategy: true,
        createdAt: true,
      },
    }),
    prisma.marketSnapshot.findMany({
      orderBy: [{ snapshotDate: "desc" }, { createdAt: "desc" }],
      take: 48,
      select: {
        regionSlug: true,
        propertyType: true,
        mode: true,
        snapshotDate: true,
        medianPriceCents: true,
        medianPricePerSqft: true,
        activeListingCount: true,
        newListingCount: true,
        confidenceLevel: true,
        directionLabel: true,
      },
    }),
    prisma.workspaceBrokerReputation.findMany({
      where: { brokerUserId: userId },
      orderBy: { activityScore: "desc" },
      take: 8,
      select: {
        workspaceId: true,
        activityScore: true,
        score: true,
        dealsCounted: true,
        updatedAt: true,
      },
    }),
    prisma.aIWorkflow.findMany({
      where: {
        ownerType,
        ownerId: userId,
        updatedAt: { gte: since },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        updatedAt: true,
      },
    }),
  ]);

  const seenZone = new Set<string>();
  const marketZones: MarketZoneRow[] = [];
  for (const s of rawSnapshots) {
    const key = `${s.regionSlug}:${s.propertyType}:${s.mode ?? ""}`;
    if (seenZone.has(key)) continue;
    seenZone.add(key);
    marketZones.push({
      regionSlug: s.regionSlug,
      propertyType: s.propertyType,
      mode: s.mode,
      snapshotDate: s.snapshotDate.toISOString(),
      medianPriceCents: s.medianPriceCents != null ? s.medianPriceCents.toString() : null,
      medianPricePerSqft: s.medianPricePerSqft != null ? String(s.medianPricePerSqft) : null,
      activeListingCount: s.activeListingCount,
      newListingCount: s.newListingCount,
      confidenceLevel: s.confidenceLevel,
      directionLabel: s.directionLabel,
    });
    if (marketZones.length >= 10) break;
  }

  const incompleteMarket =
    rawSnapshots.length === 0 || marketZones.length < 3;

  if (incompleteMarket) {
    window.label = "Platform + partial market data";
  }

  const buyBoxMatches = savedSearches.map((s) => {
    const { keys, preview } = summarizeFilters(s.filtersJson);
    return {
      id: s.id,
      mode: s.mode,
      name: s.name,
      createdAt: s.createdAt.toISOString(),
      filterKeys: keys,
      filtersPreview: preview,
    };
  });

  return {
    meta: {
      ownerType,
      ownerId: userId,
      digestDayUtc: digestDayUtc(now).toISOString(),
      window,
      digestUsesIncompleteMarketData: incompleteMarket,
      counts: {
        watchlistAlerts: watchlistAlerts.length,
        alertCandidates: alertCandidates.length,
        deals: deals.length,
        buyBoxMatches: buyBoxMatches.length,
        watchlistAdds: watchlistItemsAdded.length,
        watchlistSnapshots: watchlistSnapshots.length,
        portfolioRows: investorPortfolioRows.length,
        investmentDeals: investmentDeals.length,
        marketZones: marketZones.length,
        workspaceZones: workspaceZones.length,
        workflows: workflows.length,
      },
    },
    alerts: {
      watchlist: watchlistAlerts.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      candidates: alertCandidates.map((a) => ({
        id: a.id,
        type: a.type,
        status: a.status,
        listingId: a.listingId,
        createdAt: a.createdAt.toISOString(),
        payloadPreview: (() => {
          try {
            return JSON.stringify(a.payload).slice(0, 1500);
          } catch {
            return "";
          }
        })(),
      })),
    },
    deals: deals.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
    buyBoxMatches,
    watchlist: {
      newItems: watchlistItemsAdded.map((w) => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
      })),
      scoreSnapshots: watchlistSnapshots.map((w) => ({
        ...w,
        createdAt: w.createdAt.toISOString(),
      })),
    },
    portfolio: {
      holdings: investorPortfolioRows.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
      newAnalyses: investmentDeals.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    },
    marketZones,
    workspaceActivityZones: workspaceZones.map((z) => ({
      ...z,
      updatedAt: z.updatedAt.toISOString(),
    })),
    workflows: workflows.map((w) => ({
      ...w,
      updatedAt: w.updatedAt.toISOString(),
    })),
  };
}
