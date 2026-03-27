import { prisma } from "@/lib/db";
import { createRefreshJob } from "@/modules/deal-analyzer/infrastructure/services/refreshSchedulingService";
import { runComparableRefreshJob } from "@/modules/deal-analyzer/application/runComparableRefreshJob";

export async function scheduleComparableRefresh(args: {
  listingId: string;
  triggerSource: string;
  runSync?: boolean;
}) {
  const analysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId: args.listingId },
    orderBy: { createdAt: "desc" },
  });
  const job = await createRefreshJob({
    propertyId: args.listingId,
    analysisId: analysis?.id ?? null,
    refreshType: "comparables",
    triggerSource: args.triggerSource,
  });
  if (args.runSync) {
    return runComparableRefreshJob(job.id);
  }
  return { ok: true as const, jobId: job.id };
}
