import { prisma } from "@/lib/db";

import type { AcquisitionMetricsVm, AcquisitionPipelineStage, AcquisitionSummaryMobileVm } from "./acquisition.types";

export async function getAcquisitionSummaryMobileVm(): Promise<AcquisitionSummaryMobileVm> {
  const metrics = await computeAcquisitionMetrics();
  const recent = await prisma.lecipmAcquisitionContact.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      type: true,
      pipelineStage: true,
      createdAt: true,
    },
  });

  const grouped = await prisma.lecipmAcquisitionContact.groupBy({
    by: ["pipelineStage"],
    _count: { _all: true },
  });

  const pipelineCounts = {
    NEW: 0,
    CONTACTED: 0,
    FOLLOW_UP: 0,
    DEMO_SCHEDULED: 0,
    CONVERTED: 0,
    LOST: 0,
  } satisfies Record<AcquisitionPipelineStage, number>;

  for (const g of grouped) {
    const k = g.pipelineStage as AcquisitionPipelineStage;
    if (k in pipelineCounts) pipelineCounts[k] = g._count._all;
  }

  return {
    metrics,
    pipelineCounts,
    recentContacts: recent.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type as AcquisitionSummaryMobileVm["recentContacts"][number]["type"],
      pipelineStage: r.pipelineStage as AcquisitionPipelineStage,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function computeAcquisitionMetrics(): Promise<AcquisitionMetricsVm> {
  const rows = await prisma.lecipmAcquisitionContact.findMany({
    select: {
      type: true,
      pipelineStage: true,
      leadsGenerated: true,
      revenueCents: true,
      timeToOnboardMs: true,
      convertedAt: true,
    },
  });

  const totalContacts = rows.length;
  const byType: Record<string, number> = {};
  for (const r of rows) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
  }

  const conversionRateByType: Record<string, number> = {};
  const ttBuckets: Record<string, number[]> = {};

  for (const t of Object.keys(byType)) {
    const subset = rows.filter((r) => r.type === t);
    const converted = subset.filter((r) => r.pipelineStage === "CONVERTED").length;
    conversionRateByType[t] = subset.length === 0 ? 0 : converted / subset.length;

    const tt = subset.filter((r) => r.timeToOnboardMs != null).map((r) => r.timeToOnboardMs!);
    ttBuckets[t] = tt;
  }

  const avgTimeToOnboardMsByType: Record<string, number | null> = {};
  for (const t of Object.keys(byType)) {
    const arr = ttBuckets[t] ?? [];
    avgTimeToOnboardMsByType[t] =
      arr.length === 0 ? null : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  const sumLeads = rows.reduce((a, r) => a + r.leadsGenerated, 0);
  const avgLeadsPerContact = totalContacts === 0 ? 0 : sumLeads / totalContacts;

  const convertedRows = rows.filter((r) => r.pipelineStage === "CONVERTED");
  const sumRev = convertedRows.reduce((a, r) => a + r.revenueCents, 0);
  const avgRevenuePerConvertedCents = convertedRows.length === 0 ? 0 : Math.round(sumRev / convertedRows.length);

  return {
    totalContacts,
    byType,
    conversionRateByType,
    avgTimeToOnboardMsByType,
    avgLeadsPerContact,
    avgRevenuePerConvertedCents,
  };
}
