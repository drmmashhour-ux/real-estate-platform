import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAlert } from "@/lib/monitoring/alerts";
import { assertMonitoringDataLayerEnabled } from "@/lib/monitoring/safety";

type RunMetadata = { resultIds?: string[] };

export async function runSavedSearch(savedSearchId: string) {
  assertMonitoringDataLayerEnabled();

  const search = await prisma.monitoringSavedSearch.findUnique({
    where: { id: savedSearchId },
  });

  if (!search) throw new Error("SAVED_SEARCH_NOT_FOUND");

  let results: { id: string }[] = [];

  if (search.searchType === "listing" || search.searchType === "buy_box") {
    const where: Prisma.FsboListingWhereInput = {
      status: "ACTIVE",
      moderationStatus: "APPROVED",
    };
    if (search.city?.trim()) {
      where.city = { equals: search.city.trim(), mode: "insensitive" };
    }
    if (search.requiredZone?.trim()) {
      where.region = { equals: search.requiredZone.trim(), mode: "insensitive" };
    }
    if (search.propertyType?.trim()) {
      where.propertyType = search.propertyType.trim();
    }
    if (search.minPriceCents != null || search.maxPriceCents != null) {
      where.priceCents = {};
      if (search.minPriceCents != null) where.priceCents.gte = search.minPriceCents;
      if (search.maxPriceCents != null) where.priceCents.lte = search.maxPriceCents;
    }
    if (search.bedrooms != null) {
      where.bedrooms = { gte: search.bedrooms };
    }
    if (search.bathrooms != null) {
      where.bathrooms = { gte: Math.ceil(search.bathrooms) };
    }
    if (search.minAreaSqft != null || search.maxAreaSqft != null) {
      where.surfaceSqft = {};
      if (search.minAreaSqft != null) where.surfaceSqft.gte = Math.round(search.minAreaSqft);
      if (search.maxAreaSqft != null) where.surfaceSqft.lte = Math.round(search.maxAreaSqft);
    }

    const rows = await prisma.fsboListing.findMany({
      where,
      select: { id: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    results = rows;
  } else if (search.searchType === "deal") {
    const where: Prisma.InvestmentOpportunityWhereInput = {};
    if (search.minCapRate != null) {
      where.score = { gte: search.minCapRate };
    }
    if (search.minROI != null) {
      where.expectedROI = { gte: search.minROI };
    }
    const rows = await prisma.investmentOpportunity.findMany({
      where,
      select: { id: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    results = rows;
  }

  const priorRun = await prisma.monitoringSavedSearchRun.findFirst({
    where: { savedSearchId },
    orderBy: { createdAt: "desc" },
  });

  const prevMeta = priorRun?.metadata as RunMetadata | null;
  const previousIds = new Set(prevMeta?.resultIds ?? []);
  const currentIds = results.map((r) => r.id);
  const newIds = currentIds.filter((id) => !previousIds.has(id));

  const run = await prisma.monitoringSavedSearchRun.create({
    data: {
      savedSearchId,
      resultCount: results.length,
      newResultCount: newIds.length,
      metadata: { resultIds: currentIds } as Prisma.InputJsonValue,
    },
  });

  if (newIds.length > 0) {
    await createAlert({
      ownerType: search.ownerType,
      ownerId: search.ownerId,
      alertType: "new_match",
      severity: "info",
      title: `New results for ${search.title}`,
      message: `${newIds.length} new matches for your saved search (advisory — human review required before any action).`,
      referenceType: "saved_search",
      referenceId: search.id,
      metadata: {
        runId: run.id,
        newIds,
      } as Prisma.InputJsonValue,
    });
  }

  return { search, results, run };
}
