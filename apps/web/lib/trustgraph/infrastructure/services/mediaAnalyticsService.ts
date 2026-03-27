import { prisma } from "@/lib/db";

export async function mediaClassificationHealthSummary() {
  const lowScene = await prisma.mediaVerificationJob.count({
    where: { sceneConfidence: { lt: 0.4 } },
  });
  const total = await prisma.mediaVerificationJob.count();
  return { totalJobs: total, lowConfidenceSceneJobs: lowScene };
}
