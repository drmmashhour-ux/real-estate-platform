import { prisma } from "@/lib/db";

export async function extractionJobHealthSummary() {
  const [total, needsReview, failed] = await Promise.all([
    prisma.trustgraphExtractionJob.count(),
    prisma.trustgraphExtractionJob.count({ where: { status: "needs_review" } }),
    prisma.trustgraphExtractionJob.count({ where: { status: "failed" } }),
  ]);
  return { total, needsReview, failed };
}
