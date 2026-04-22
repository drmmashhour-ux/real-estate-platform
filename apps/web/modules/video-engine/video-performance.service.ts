import { prisma } from "@/lib/db";

export type VideoPerfEvent =
  | "video_created"
  | "video_preview"
  | "video_approved"
  | "video_scheduled"
  | "video_published"
  | "impressions"
  | "clicks"
  | "leads"
  | "bookings";

export async function recordVideoPerformanceEvent(
  projectId: string,
  event: VideoPerfEvent,
  patch?: Record<string, unknown>,
): Promise<void> {
  const row = await prisma.lecipmVideoEngineProject.findUnique({
    where: { id: projectId },
    select: { performanceJson: true },
  });
  const prev = (row?.performanceJson as Record<string, unknown>) ?? {};
  const events = Array.isArray(prev.events) ? [...(prev.events as unknown[])] : [];
  events.push({
    type: event,
    at: new Date().toISOString(),
    ...(patch ?? {}),
  });

  await prisma.lecipmVideoEngineProject.update({
    where: { id: projectId },
    data: {
      performanceJson: {
        ...prev,
        events,
        lastEvent: event,
        ...patch,
      } as object,
    },
  });
}

/** Merge funnel attribution (landing, social post, conversions) — never overwrites audit `events`. */
export async function patchVideoAttribution(projectId: string, patch: Record<string, unknown>): Promise<void> {
  const row = await prisma.lecipmVideoEngineProject.findUnique({
    where: { id: projectId },
    select: { performanceJson: true },
  });
  const prev = (row?.performanceJson as Record<string, unknown>) ?? {};
  await prisma.lecipmVideoEngineProject.update({
    where: { id: projectId },
    data: {
      performanceJson: {
        ...prev,
        attribution: {
          ...(typeof prev.attribution === "object" && prev.attribution !== null ? (prev.attribution as Record<string, unknown>) : {}),
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      } as object,
    },
  });
}

export async function syncVideoPerformanceMetrics(
  projectId: string,
  metrics: { impressions?: number; clicks?: number; conversions?: number },
): Promise<void> {
  const row = await prisma.lecipmVideoEngineProject.findUnique({
    where: { id: projectId },
    select: { performanceJson: true },
  });
  const prev = (row?.performanceJson as Record<string, unknown>) ?? {};
  await prisma.lecipmVideoEngineProject.update({
    where: { id: projectId },
    data: {
      performanceJson: {
        ...prev,
        ...(metrics.impressions !== undefined ? { impressions: metrics.impressions } : {}),
        ...(metrics.clicks !== undefined ? { clicks: metrics.clicks } : {}),
        ...(metrics.conversions !== undefined ? { conversions: metrics.conversions } : {}),
      } as object,
    },
  });
}

export async function getVideoEnginePerformanceSummary(): Promise<{
  created: number;
  approved: number;
  published: number;
  impressionsApprox: number;
  clicksApprox: number;
}> {
  const [created, approved, published, metricRows] = await Promise.all([
    prisma.lecipmVideoEngineProject.count(),
    prisma.lecipmVideoEngineProject.count({
      where: { status: { in: ["approved", "scheduled", "published"] } },
    }),
    prisma.lecipmVideoEngineProject.count({ where: { status: "published" } }),
    prisma.lecipmVideoEngineProject.findMany({
      select: { performanceJson: true },
      take: 800,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  let impressionsApprox = 0;
  let clicksApprox = 0;
  for (const r of metricRows) {
    const p = (r.performanceJson as Record<string, unknown>) ?? {};
    impressionsApprox += Number(p.impressions ?? 0);
    clicksApprox += Number(p.clicks ?? 0);
  }

  return {
    created,
    approved,
    published,
    impressionsApprox,
    clicksApprox,
  };
}
