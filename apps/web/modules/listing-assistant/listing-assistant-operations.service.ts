import { prisma } from "@/lib/db";
import { getListingIdsForBroker } from "@/lib/broker/collaboration";
import { checkListingCompliance } from "@/modules/listing-assistant/listing-compliance.checker";
import { computeListingReadiness } from "@/modules/listing-assistant/listing-readiness.service";
import {
  benchmarkNonAssistedConversionProxy,
  listAssistedListingPerformance,
} from "@/modules/listing-assistant/listing-assistant-performance.service";
import type { ListingAssistantContentSnapshot } from "@/modules/listing-assistant/listing-version.types";

function parseSnapshot(raw: unknown): ListingAssistantContentSnapshot {
  const o = raw as Record<string, unknown>;
  return {
    title: typeof o.title === "string" ? o.title : "",
    description: typeof o.description === "string" ? o.description : "",
    propertyHighlights: Array.isArray(o.propertyHighlights) ? (o.propertyHighlights as string[]) : [],
    language: o.language === "fr" || o.language === "ar" ? o.language : "en",
  };
}

export async function buildListingAssistantOperationsDashboard(params: {
  actorUserId: string;
  isAdmin: boolean;
}) {
  const allowedIds =
    params.isAdmin ? null
    : (await getListingIdsForBroker(params.actorUserId));

  const versionWhere =
    allowedIds ? { listingId: { in: allowedIds } } : {};

  const recentVersions = await prisma.listingAssistantContentVersion.findMany({
    where: versionWhere,
    orderBy: { createdAt: "desc" },
    take: 35,
    include: {
      listing: { select: { id: true, listingCode: true, title: true } },
    },
  });

  const warningHistogram = new Map<string, number>();
  for (const row of recentVersions) {
    const snap = parseSnapshot(row.content);
    const compliance = checkListingCompliance({
      title: snap.title,
      description: snap.description,
      highlights: snap.propertyHighlights,
    });
    for (const w of compliance.warnings) {
      const key = w.slice(0, 120);
      warningHistogram.set(key, (warningHistogram.get(key) ?? 0) + 1);
    }
  }

  const commonWarnings = [...warningHistogram.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([warning, count]) => ({ warning, count }));

  const readinessRows = recentVersions.slice(0, 15).map((row) => {
    const snap = parseSnapshot(row.content);
    const compliance = checkListingCompliance({
      title: snap.title,
      description: snap.description,
      highlights: snap.propertyHighlights,
    });
    const readiness = computeListingReadiness({
      content: {
        title: snap.title,
        description: snap.description,
        propertyHighlights: snap.propertyHighlights,
        language: snap.language,
      },
      compliance,
      partial: {},
      pricing: null,
    });
    return {
      versionId: row.id,
      listingId: row.listingId,
      listingCode: row.listing.listingCode,
      listingTitle: row.listing.title,
      phase: row.phase,
      createdAt: row.createdAt.toISOString(),
      readinessStatus: readiness.readinessStatus,
      readinessScore: readiness.readinessScore,
    };
  });

  const perf = await listAssistedListingPerformance(params.actorUserId, {
    isAdmin: params.isAdmin,
    take: 20,
  });
  const bench =
    params.isAdmin ? null
    : await benchmarkNonAssistedConversionProxy(params.actorUserId, perf.map((p) => p.listingId));

  const underperformers = perf.filter(
    (p) => p.viewsTotal >= 25 && p.conversionProxy < 0.02 && p.versionCount >= 1
  );

  return {
    generatedAt: new Date().toISOString(),
    recentDrafts: recentVersions.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      listingCode: r.listing.listingCode,
      listingTitle: r.listing.title,
      phase: r.phase,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
    })),
    readinessPreview: readinessRows,
    commonComplianceWarnings: commonWarnings,
    assistedPerformance: perf,
    benchmarkConversionProxyNonAssisted: bench,
    assistedUnderperformanceAlerts: underperformers.map((p) => ({
      listingId: p.listingId,
      listingCode: p.listingCode,
      title: p.title,
      viewsTotal: p.viewsTotal,
      conversionProxy: p.conversionProxy,
      note: "High traffic but near-zero engagement proxy — refresh creative, pricing story, or compliance posture.",
    })),
  };
}
