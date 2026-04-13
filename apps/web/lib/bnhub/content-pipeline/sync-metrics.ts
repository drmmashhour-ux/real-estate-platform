import { prisma } from "@/lib/db";

/**
 * Pull views / clicks / conversions from Metricool, Later, or TikTok Business API.
 * Stub: wire HTTP when tokens exist; otherwise no-op.
 */
export async function syncContentGeneratedMetrics(contentGeneratedId: string): Promise<void> {
  const row = await prisma.contentGenerated.findUnique({
    where: { id: contentGeneratedId },
    select: { id: true, schedulerExternalId: true },
  });
  if (!row?.schedulerExternalId?.trim()) return;

  // Placeholder: fetch metrics from provider and persist
  await prisma.contentGenerated.update({
    where: { id: contentGeneratedId },
    data: {
      metricsSyncedAt: new Date(),
    },
  });
}
